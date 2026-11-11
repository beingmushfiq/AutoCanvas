<?php

namespace App\Modules\Community\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\Community\Models\SocialConversation;
use App\Modules\Community\Models\SocialMessage;
use App\Modules\Community\Services\InboxSyncService;
use App\Modules\Community\Services\ResponseDraftingService;
use App\Modules\SocialConnectors\Models\SocialAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InboxController extends Controller
{
    /**
     * Resolve active organization ID from request container.
     */
    protected function currentOrgId(): ?string
    {
        return app()->has('current_organization_id') ? app('current_organization_id') : null;
    }

    /**
     * List all conversations for a brand with optional filtering.
     */
    public function conversations(Request $request, string $id): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $brand = Brand::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($id);

        $query = SocialConversation::where('brand_id', $brand->id)
            ->when($orgId, fn ($q) => $q->where('organization_id', $orgId))
            ->with([
                'latestMessage',
                'socialAccount:id,platform,account_name,username,avatar_url',
            ]);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($platform = $request->input('platform')) {
            $query->where('platform', $platform);
        }

        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }

        $perPage = $request->integer('per_page', 25);
        $conversations = $query->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $conversations->items(),
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
            ],
        ]);
    }

    /**
     * Fetch conversation thread details with complete message history.
     */
    public function showConversation(string $conversationId): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $conversation = SocialConversation::with([
            'messages',
            'brand.voiceProfile',
            'socialAccount:id,platform,account_name,username,avatar_url',
        ])
            ->when($orgId, fn ($q) => $q->where('organization_id', $orgId))
            ->findOrFail($conversationId);

        return response()->json([
            'success' => true,
            'data' => $conversation,
        ]);
    }

    /**
     * Approve and dispatch a reply to the customer on the social platform.
     */
    public function reply(Request $request, string $messageId, ResponseDraftingService $service): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $parentMessage = SocialMessage::with('conversation.socialAccount', 'brand')
            ->when($orgId, fn ($q) => $q->where('organization_id', $orgId))
            ->findOrFail($messageId);

        $validated = $request->validate([
            'reply_text' => 'required|string|max:1000',
        ]);

        $reply = $service->approveAndDispatchReply(
            $parentMessage,
            $validated['reply_text'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Reply dispatched to social network.',
            'data' => $reply,
        ]);
    }

    /**
     * Regenerate or generate an on-demand AI draft reply for a message.
     */
    public function generateDraft(string $messageId, ResponseDraftingService $service): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $message = SocialMessage::with('brand.voiceProfile')
            ->when($orgId, fn ($q) => $q->where('organization_id', $orgId))
            ->findOrFail($messageId);

        $draft = $service->generateDraftReply($message->brand, $message);

        return response()->json([
            'success' => true,
            'message' => 'AI draft reply generated.',
            'data' => [
                'ai_draft_reply' => $draft,
                'message' => $message->fresh(),
            ],
        ]);
    }

    /**
     * Mark conversation thread as resolved.
     */
    public function resolve(string $conversationId): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $conversation = SocialConversation::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($conversationId);
        $conversation->update(['status' => 'resolved']);

        return response()->json([
            'success' => true,
            'message' => 'Conversation marked as resolved.',
            'data' => $conversation,
        ]);
    }

    /**
     * Escalate conversation thread to high or urgent priority.
     */
    public function escalate(Request $request, string $conversationId): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $conversation = SocialConversation::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($conversationId);
        $priority = $request->input('priority', 'urgent');

        $conversation->update([
            'status' => 'escalated',
            'priority' => in_array($priority, ['urgent', 'high', 'medium', 'low']) ? $priority : 'urgent',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Conversation escalated.',
            'data' => $conversation,
        ]);
    }

    /**
     * Flag conversation as spam and hide its messages.
     */
    public function markSpam(string $conversationId): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $conversation = SocialConversation::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($conversationId);
        $conversation->update([
            'status' => 'spam',
            'priority' => 'low',
        ]);

        $conversation->messages()->update([
            'is_hidden_on_platform' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Conversation flagged as spam.',
            'data' => $conversation,
        ]);
    }

    /**
     * Ingest an inbound message or webhook event for a social account.
     */
    public function ingest(Request $request, string $accountId, InboxSyncService $syncService): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $account = SocialAccount::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($accountId);

        $validated = $request->validate([
            'message_text' => 'required|string',
            'platform_message_id' => 'nullable|string|max:255',
            'platform_thread_id' => 'nullable|string|max:255',
            'platform_post_id' => 'nullable|string|max:255',
            'parent_message_id' => 'nullable|string|max:255',
            'sender_id' => 'nullable|string|max:255',
            'sender_name' => 'nullable|string|max:255',
            'sender_avatar_url' => 'nullable|url|max:500',
            'conversation_type' => 'nullable|string|in:post_comments,direct_message,mention',
        ]);

        $message = $syncService->ingestMessage($account, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Message ingested into inbox.',
            'data' => $message->load('conversation'),
        ], 201);
    }
}
