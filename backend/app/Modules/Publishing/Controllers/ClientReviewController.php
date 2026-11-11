<?php

namespace App\Modules\Publishing\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Organization\Services\AuditLogger;
use App\Modules\Publishing\Models\MagicReviewLink;
use App\Modules\Publishing\Models\PublishingDispatch;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClientReviewController extends Controller
{
    /**
     * Generate an expiring signed Magic Review Link for a content dispatch.
     */
    public function generate(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');
        $validated = $request->validate([
            'dispatch_id' => ['required', 'string'],
            'client_name' => ['required', 'string', 'max:128'],
            'client_email' => ['nullable', 'email', 'max:128'],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:30'],
        ]);

        $dispatch = PublishingDispatch::where('organization_id', $orgId)->findOrFail($validated['dispatch_id']);
        $days = (int) ($validated['expires_in_days'] ?? 7);

        $token = Str::random(40);
        $reviewLink = MagicReviewLink::create([
            'organization_id' => $orgId,
            'brand_id' => $dispatch->brand_id,
            'content_item_id' => $dispatch->content_item_id,
            'dispatch_id' => $dispatch->id,
            'token' => $token,
            'client_name' => $validated['client_name'],
            'client_email' => $validated['client_email'] ?? null,
            'status' => 'active',
            'expires_at' => Carbon::now()->addDays($days),
        ]);

        $reviewUrl = url("/review/{$token}");

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $reviewLink->id,
                'token' => $token,
                'review_url' => $reviewUrl,
                'client_name' => $reviewLink->client_name,
                'expires_at' => $reviewLink->expires_at->toIso8601String(),
            ],
            'message' => 'Magic review link generated successfully.',
        ]);
    }

    /**
     * Public show endpoint for client review (zero login required).
     */
    public function show(string $token): JsonResponse
    {
        $link = MagicReviewLink::withoutGlobalScopes()
            ->with(['brand', 'contentItem.variants', 'dispatch'])
            ->where('token', $token)
            ->first();

        if (!$link) {
            return response()->json([
                'success' => false,
                'error' => ['code' => 'LINK_NOT_FOUND', 'message' => 'This review link is invalid or has expired.'],
            ], 404);
        }

        if ($link->isExpired()) {
            return response()->json([
                'success' => false,
                'error' => ['code' => 'LINK_EXPIRED', 'message' => 'This review link has expired. Please request a new link from the agency.'],
            ], 410);
        }

        $link->update(['accessed_at' => now()]);

        $item = $link->contentItem;
        $variants = $item?->variants ?? [];

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $link->token,
                'client_name' => $link->client_name,
                'status' => $link->status,
                'expires_at' => $link->expires_at->toIso8601String(),
                'brand' => [
                    'name' => $link->brand?->name ?? 'Brand Client',
                    'logo_url' => $link->brand?->visualIdentity?->primary_logo_url,
                ],
                'post' => [
                    'topic' => $item?->topic ?? 'Upcoming Publication',
                    'concept' => $item?->concept,
                    'scheduled_for' => $item?->scheduled_for ?? $link->dispatch?->scheduled_at,
                    'variants' => $variants,
                ],
                'existing_feedback' => $link->client_feedback,
            ],
        ]);
    }

    /**
     * Client approves the dispatch.
     */
    public function approve(Request $request, string $token): JsonResponse
    {
        $link = MagicReviewLink::withoutGlobalScopes()->where('token', $token)->firstOrFail();

        if (!$link->isValid()) {
            return response()->json([
                'success' => false,
                'error' => ['code' => 'LINK_INACTIVE', 'message' => 'This link cannot be modified.'],
            ], 400);
        }

        $link->update([
            'status' => 'approved',
            'actioned_at' => now(),
        ]);

        if ($link->contentItem) {
            $link->contentItem->update(['status' => 'approved']);
        }

        AuditLogger::log(
            'client_review.approved',
            $link,
            null,
            ['client_name' => $link->client_name, 'token' => $token],
            $link->organization_id
        );

        return response()->json([
            'success' => true,
            'status' => 'approved',
            'message' => 'Post approved! Scheduled for automatic publishing.',
        ]);
    }

    /**
     * Client requests editorial changes.
     */
    public function requestChanges(Request $request, string $token): JsonResponse
    {
        $link = MagicReviewLink::withoutGlobalScopes()->where('token', $token)->firstOrFail();

        if (!$link->isValid()) {
            return response()->json([
                'success' => false,
                'error' => ['code' => 'LINK_INACTIVE', 'message' => 'This link cannot be modified.'],
            ], 400);
        }

        $validated = $request->validate([
            'feedback' => ['required', 'string', 'max:2000'],
            'feedback_details' => ['nullable', 'array'],
        ]);

        $link->update([
            'status' => 'changes_requested',
            'client_feedback' => $validated['feedback'],
            'feedback_details' => $validated['feedback_details'] ?? null,
            'actioned_at' => now(),
        ]);

        if ($link->contentItem) {
            $link->contentItem->update(['status' => 'changes_requested']);
        }

        AuditLogger::log(
            'client_review.changes_requested',
            $link,
            null,
            ['client_name' => $link->client_name, 'feedback' => $validated['feedback']],
            $link->organization_id
        );

        return response()->json([
            'success' => true,
            'status' => 'changes_requested',
            'message' => 'Feedback submitted! The creative team has been notified.',
        ]);
    }
}
