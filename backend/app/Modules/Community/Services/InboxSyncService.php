<?php

namespace App\Modules\Community\Services;

use App\Modules\Community\Models\SocialConversation;
use App\Modules\Community\Models\SocialMessage;
use App\Modules\SocialConnectors\Models\SocialAccount;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class InboxSyncService
{
    public function __construct(
        protected MessageClassificationService $classifier,
        protected ResponseDraftingService $draftingService
    ) {}

    /**
     * Ingest a single inbound message or comment into the unified inbox.
     */
    public function ingestMessage(SocialAccount $account, array $payload): SocialMessage
    {
        $platformMessageId = $payload['platform_message_id'] ?? 'msg_' . Str::ulid();

        // 1. Deduplication Check
        $existing = SocialMessage::where('platform_message_id', $platformMessageId)->first();
        if ($existing) {
            return $existing;
        }

        $platformThreadId = $payload['platform_thread_id'] ?? $payload['platform_post_id'] ?? 'thread_' . Str::ulid();
        $messageText = trim($payload['message_text'] ?? '');
        $senderName = $payload['sender_name'] ?? 'Social User';

        // 2. Classify Message Intent & Sentiment
        $brand = $account->brand;
        $classification = $this->classifier->classifyMessage($brand, $messageText);

        // 3. Resolve or Create Conversation Thread
        $conversation = SocialConversation::firstOrCreate(
            [
                'social_account_id' => $account->id,
                'platform_thread_id' => $platformThreadId,
            ],
            [
                'organization_id' => $account->organization_id,
                'workspace_id' => $account->workspace_id,
                'brand_id' => $account->brand_id,
                'platform' => $account->platform,
                'conversation_type' => $payload['conversation_type'] ?? 'post_comments',
                'platform_post_id' => $payload['platform_post_id'] ?? null,
                'sender_id' => $payload['sender_id'] ?? 'user_anon',
                'sender_name' => $senderName,
                'sender_avatar_url' => $payload['sender_avatar_url'] ?? null,
                'status' => $classification['is_spam'] ? 'spam' : 'open',
                'priority' => $classification['priority'],
                'last_message_at' => Carbon::now(),
            ]
        );

        // Escalate conversation if high-risk intent detected
        if ($classification['intent'] === 'crisis') {
            $conversation->update(['status' => 'escalated', 'priority' => 'urgent', 'last_message_at' => Carbon::now()]);
        } elseif ($classification['intent'] === 'complaint') {
            $conversation->update(['status' => 'escalated', 'priority' => 'high', 'last_message_at' => Carbon::now()]);
        } elseif ($classification['is_spam']) {
            $conversation->update(['status' => 'spam', 'priority' => 'low']);
        } else {
            $conversation->update(['last_message_at' => Carbon::now()]);
        }

        // 4. Create Message Record
        $message = SocialMessage::create([
            'organization_id' => $account->organization_id,
            'workspace_id' => $account->workspace_id,
            'brand_id' => $account->brand_id,
            'social_conversation_id' => $conversation->id,
            'direction' => 'inbound',
            'platform_message_id' => $platformMessageId,
            'parent_message_id' => $payload['parent_message_id'] ?? null,
            'sender_type' => 'customer',
            'sender_name' => $senderName,
            'message_text' => $messageText,
            'sentiment_score' => $classification['sentiment_score'],
            'intent' => $classification['intent'],
            'is_hidden_on_platform' => $classification['is_spam'],
        ]);

        // 5. Automatically Generate Brand Voice Draft Reply (if not spam)
        if (!$classification['is_spam']) {
            $this->draftingService->generateDraftReply($brand, $message);
        }

        return $message;
    }

    /**
     * Poll a social account for recent post comments.
     */
    public function syncAccount(SocialAccount $account): int
    {
        if ($account->connection_status !== 'connected' || $account->isExpired()) {
            return 0;
        }

        $newIngested = 0;

        try {
            if ($account->platform === 'facebook') {
                $pageId = $account->provider_id;
                $res = Http::timeout(15)->get("https://graph.facebook.com/v21.0/{$pageId}/feed", [
                    'access_token' => $account->access_token,
                    'fields' => 'id,comments{id,message,from,created_time}',
                    'limit' => 5,
                ]);

                if ($res->successful()) {
                    $posts = $res->json('data') ?? [];
                    foreach ($posts as $post) {
                        $comments = $post['comments']['data'] ?? [];
                        foreach ($comments as $c) {
                            $this->ingestMessage($account, [
                                'platform_post_id' => $post['id'],
                                'platform_thread_id' => $post['id'],
                                'platform_message_id' => $c['id'],
                                'sender_id' => $c['from']['id'] ?? 'user_fb',
                                'sender_name' => $c['from']['name'] ?? 'Facebook User',
                                'message_text' => $c['message'] ?? '',
                                'conversation_type' => 'post_comments',
                            ]);
                            $newIngested++;
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Inbox sync failed for account [{$account->id}]: {$e->getMessage()}");
        }

        return $newIngested;
    }
}

