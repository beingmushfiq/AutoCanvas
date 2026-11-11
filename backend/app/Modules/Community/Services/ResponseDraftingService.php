<?php

namespace App\Modules\Community\Services;

use App\AI\Gateway\AIGateway;
use App\Models\User;
use App\Modules\Brand\Models\Brand;
use App\Modules\Community\Models\SocialMessage;
use App\Modules\Organization\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class ResponseDraftingService
{
    public function __construct(
        protected ?AIGateway $aiGateway = null
    ) {
        $this->aiGateway = $aiGateway ?? app(AIGateway::class);
    }

    /**
     * Generate an AI reply draft adhering to the brand's voice and policy constraints.
     */
    public function generateDraftReply(Brand $brand, SocialMessage $message): string
    {
        $voice = $brand->voiceProfile;
        $tone = $voice?->tone ?? 'professional, empathetic, and direct';
        $formality = $voice?->formality_level ?? 'conversational';
        $prohibited = implode(', ', $brand->profile?->prohibited_subjects ?? []);

        $prompt = <<<PROMPT
You are responding to an incoming customer message on behalf of Brand: "{$brand->name}".
Brand Tone: {$tone}
Formality Level: {$formality}
Prohibited subjects: {$prohibited}

Incoming Message from customer "{$message->sender_name}":
"{$message->message_text}"

Intent: {$message->intent}
Sentiment: {$message->sentiment_score}

Write a polite, concise, and helpful public reply (under 280 characters). Do NOT make promises about unverified features. If this is a complaint, acknowledge their experience and offer a resolution email or DM path.
PROMPT;

        $aiRes = $this->aiGateway->generateText($prompt, [
            'task_type' => 'community_reply_drafting',
            'organization_id' => $brand->organization_id,
            'brand_id' => $brand->id,
        ]);

        $replyText = trim($aiRes['text'] ?? '');
        if (empty($replyText)) {
            $replyText = match ($message->intent) {
                'praise' => "Thank you so much for the support, {$message->sender_name}! We appreciate you.",
                'complaint' => "We're sorry to hear about your experience. Please DM us or email support so our team can resolve this immediately.",
                'lead' => "Thanks for your interest! Please check out our website or send us a DM to connect with our team.",
                default => "Thanks for reaching out! Our team will get back to you shortly.",
            };
        }

        $message->update([
            'ai_draft_reply' => $replyText,
            'ai_draft_status' => 'pending',
        ]);

        return $replyText;
    }

    /**
     * Approve and publish a reply back to the remote social network platform.
     */
    public function approveAndDispatchReply(SocialMessage $parentMessage, string $replyText, ?User $agent = null): SocialMessage
    {
        $conversation = $parentMessage->conversation;
        if (!$conversation) {
            throw new RuntimeException("Parent conversation thread not found.");
        }

        $account = $conversation->socialAccount;
        if (!$account) {
            throw new RuntimeException("Social account associated with this conversation is missing.");
        }

        if ($account->isExpired()) {
            throw new RuntimeException("Social account access token is expired. Please reconnect.");
        }

        $remoteId = null;

        // 1. Dispatch reply to remote social platform
        try {
            if ($account->platform === 'facebook') {
                $commentId = $parentMessage->platform_message_id;
                $res = Http::timeout(15)->post("https://graph.facebook.com/v21.0/{$commentId}/comments", [
                    'access_token' => $account->access_token,
                    'message' => $replyText,
                ]);

                if ($res->successful()) {
                    $remoteId = (string) ($res->json('id') ?? $res->json('comment_id'));
                }
            } elseif ($account->platform === 'instagram') {
                $commentId = $parentMessage->platform_message_id;
                $res = Http::timeout(15)->post("https://graph.facebook.com/v21.0/{$commentId}/replies", [
                    'access_token' => $account->access_token,
                    'message' => $replyText,
                ]);

                if ($res->successful()) {
                    $remoteId = (string) ($res->json('id') ?? $res->json('comment_id'));
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Remote reply dispatch encountered an issue: {$e->getMessage()}");
        }

        $remoteReplyId = $remoteId ?? 'reply_' . Str::ulid();

        // 2. Persist outbound message record
        $outboundMessage = SocialMessage::create([
            'organization_id' => $parentMessage->organization_id,
            'workspace_id' => $parentMessage->workspace_id,
            'brand_id' => $parentMessage->brand_id,
            'social_conversation_id' => $conversation->id,
            'direction' => 'outbound',
            'platform_message_id' => $remoteReplyId,
            'parent_message_id' => $parentMessage->platform_message_id,
            'sender_type' => $agent ? 'agent' : 'ai_agent',
            'sender_name' => $agent ? $agent->name : $parentMessage->brand->name,
            'message_text' => $replyText,
            'sentiment_score' => 0.50,
            'intent' => 'general',
            'ai_draft_status' => 'accepted',
        ]);

        // 3. Settle parent message and conversation state
        $parentMessage->update(['ai_draft_status' => 'accepted']);
        $conversation->update([
            'status' => 'resolved',
            'last_message_at' => Carbon::now(),
        ]);

        AuditLogger::log(
            'community.reply_dispatched',
            $outboundMessage,
            null,
            [
                'platform' => $conversation->platform,
                'parent_message_id' => $parentMessage->platform_message_id,
                'sender' => $outboundMessage->sender_name,
            ],
            $parentMessage->organization_id,
            $parentMessage->workspace_id
        );

        return $outboundMessage;
    }
}
