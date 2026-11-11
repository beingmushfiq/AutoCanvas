<?php

namespace App\Modules\Publishing\Services;

use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\Organization\Services\AuditLogger;
use App\Modules\Publishing\Jobs\PublishVariantJob;
use App\Modules\Publishing\Models\PublishingDispatch;
use App\Modules\SocialConnectors\Models\SocialAccount;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;

class PublishingOrchestratorService
{
    /**
     * Dispatch a content variant immediately via high-priority queue.
     */
    public function dispatchNow(ContentVariant $variant, ?string $socialAccountId = null, ?string $customIdempotencyKey = null): PublishingDispatch
    {
        // 1. Idempotency Check: if dispatch exists for this idempotency key, safely return existing
        $idempotencyKey = $customIdempotencyKey ?? "pub_{$variant->id}_" . Carbon::now()->format('YmdH');
        $existing = PublishingDispatch::where('idempotency_key', $idempotencyKey)->first();
        if ($existing && in_array($existing->status, ['queued', 'processing', 'published'])) {
            return $existing;
        }

        // 2. Gates: Approval & Circuit Breaker
        $this->ensureVariantCanPublish($variant);

        $account = $this->resolveSocialAccount($variant, $socialAccountId);

        if ($this->isPaused($variant->organization_id)) {
            throw new RuntimeException("Automated publishing is currently paused by the emergency circuit breaker.");
        }

        $dispatch = PublishingDispatch::create([
            'organization_id' => $variant->organization_id,
            'workspace_id' => $variant->workspace_id,
            'brand_id' => $variant->contentItem->brand_id,
            'content_item_id' => $variant->content_item_id,
            'content_variant_id' => $variant->id,
            'social_account_id' => $account->id,
            'idempotency_key' => $idempotencyKey,
            'queue_name' => 'publishing-high',
            'status' => 'queued',
            'attempts' => 0,
            'payload_snapshot' => [
                'platform' => $variant->platform,
                'caption' => $variant->caption,
                'hashtags' => $variant->hashtags ?? [],
                'media_urls' => $variant->media_urls ?? [],
                'cta_text' => $variant->cta_text,
                'cta_url' => $variant->cta_url,
            ],
            'dispatched_at' => Carbon::now(),
        ]);

        $variant->update(['publishing_status' => 'queued']);

        AuditLogger::log(
            'publishing.dispatch_queued',
            $dispatch,
            null,
            ['platform' => $variant->platform, 'queue' => 'publishing-high'],
            $variant->organization_id,
            $variant->workspace_id
        );

        PublishVariantJob::dispatch($dispatch->id)->onQueue('publishing-high');

        return $dispatch;
    }

    /**
     * Schedule a content variant for future publishing via normal queue.
     */
    public function schedule(ContentVariant $variant, Carbon|string $publishAt, ?string $socialAccountId = null): PublishingDispatch
    {
        $scheduledCarbon = is_string($publishAt) ? Carbon::parse($publishAt) : $publishAt;
        if ($scheduledCarbon->isPast()) {
            throw new RuntimeException("Scheduled time must be in the future.");
        }

        $idempotencyKey = "pub_sched_{$variant->id}_" . $scheduledCarbon->format('YmdHi');

        $existing = PublishingDispatch::where('idempotency_key', $idempotencyKey)->first();
        if ($existing && in_array($existing->status, ['queued', 'processing', 'published'])) {
            return $existing;
        }

        $this->ensureVariantCanPublish($variant);

        $account = $this->resolveSocialAccount($variant, $socialAccountId);

        if ($this->isPaused($variant->organization_id)) {
            throw new RuntimeException("Automated publishing is currently paused by the emergency circuit breaker.");
        }

        $dispatch = PublishingDispatch::create([
            'organization_id' => $variant->organization_id,
            'workspace_id' => $variant->workspace_id,
            'brand_id' => $variant->contentItem->brand_id,
            'content_item_id' => $variant->content_item_id,
            'content_variant_id' => $variant->id,
            'social_account_id' => $account->id,
            'idempotency_key' => $idempotencyKey,
            'queue_name' => 'publishing-normal',
            'status' => 'queued',
            'attempts' => 0,
            'payload_snapshot' => [
                'platform' => $variant->platform,
                'caption' => $variant->caption,
                'hashtags' => $variant->hashtags ?? [],
                'media_urls' => $variant->media_urls ?? [],
                'cta_text' => $variant->cta_text,
                'cta_url' => $variant->cta_url,
            ],
            'scheduled_at' => $scheduledCarbon,
            'dispatched_at' => Carbon::now(),
        ]);

        $variant->update([
            'publishing_status' => 'scheduled',
            'scheduled_at' => $scheduledCarbon,
        ]);

        PublishVariantJob::dispatch($dispatch->id)
            ->onQueue('publishing-normal')
            ->delay($scheduledCarbon);

        AuditLogger::log(
            'publishing.dispatch_scheduled',
            $dispatch,
            null,
            ['platform' => $variant->platform, 'scheduled_at' => $scheduledCarbon->toIso8601String()],
            $variant->organization_id,
            $variant->workspace_id
        );

        return $dispatch;
    }

    /**
     * Cancel a pending dispatch.
     */
    public function cancelDispatch(PublishingDispatch $dispatch): bool
    {
        if ($dispatch->status !== 'queued') {
            return false;
        }

        $dispatch->update(['status' => 'cancelled']);
        $dispatch->contentVariant->update(['publishing_status' => 'draft']);

        AuditLogger::log(
            'publishing.dispatch_cancelled',
            $dispatch,
            null,
            ['idempotency_key' => $dispatch->idempotency_key],
            $dispatch->organization_id,
            $dispatch->workspace_id
        );

        return true;
    }

    /**
     * Emergency Circuit Breaker: Halt all automations for an organization.
     */
    public function triggerEmergencyPause(string $organizationId): void
    {
        Cache::forever("tenant:circuit_breaker:{$organizationId}", true);

        // Cancel pending queued dispatches
        PublishingDispatch::where('organization_id', $organizationId)
            ->where('status', 'queued')
            ->update(['status' => 'cancelled']);

        AuditLogger::log(
            'publishing.circuit_breaker_paused',
            null,
            null,
            ['action' => 'PAUSE_ALL_AUTOMATIONS'],
            $organizationId
        );
    }

    /**
     * Resume automated publishing for an organization.
     */
    public function resumeAutomations(string $organizationId): void
    {
        Cache::forget("tenant:circuit_breaker:{$organizationId}");

        AuditLogger::log(
            'publishing.circuit_breaker_resumed',
            null,
            null,
            ['action' => 'RESUME_ALL_AUTOMATIONS'],
            $organizationId
        );
    }

    /**
     * Check if publishing circuit breaker is active for an organization.
     */
    public function isPaused(string $organizationId): bool
    {
        return (bool) Cache::get("tenant:circuit_breaker:{$organizationId}", false);
    }

    /**
     * Validate approval state before allowing publishing.
     */
    protected function ensureVariantCanPublish(ContentVariant $variant): void
    {
        $item = $variant->contentItem;
        if (!$item || $item->status !== 'approved') {
            throw new RuntimeException("Cannot publish unapproved content. Current status: " . ($item->status ?? 'none'));
        }
    }

    /**
     * Resolve and validate destination SocialAccount.
     */
    protected function resolveSocialAccount(ContentVariant $variant, ?string $accountId = null): SocialAccount
    {
        $query = SocialAccount::where('organization_id', $variant->organization_id);

        if ($accountId) {
            $account = $query->where('id', $accountId)->first();
        } else {
            // First look for brand-specific connected account
            $account = (clone $query)->where('brand_id', $variant->contentItem->brand_id)
                ->where('platform', $variant->platform)
                ->where('connection_status', 'connected')
                ->first();

            // Fallback to workspace/org level account for this platform
            if (!$account) {
                $account = (clone $query)->where('platform', $variant->platform)
                    ->where('connection_status', 'connected')
                    ->first();
            }
        }

        if (!$account) {
            throw new RuntimeException("No active social account connected for platform [{$variant->platform}].");
        }

        if ($account->connection_status !== 'connected') {
            throw new RuntimeException("Social account [{$account->account_name}] is not connected.");
        }

        if ($account->isExpired()) {
            throw new RuntimeException("Social account [{$account->account_name}] access token is expired. Please reconnect.");
        }

        return $account;
    }
}
