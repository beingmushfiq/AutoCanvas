<?php

namespace App\Modules\Publishing\Jobs;

use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\Organization\Services\AuditLogger;
use App\Modules\Publishing\Models\PublishingDispatch;
use App\Modules\Publishing\Services\PublishingOrchestratorService;
use App\Modules\SocialConnectors\Connectors\FacebookConnector;
use App\Modules\SocialConnectors\Connectors\InstagramConnector;
use App\Modules\SocialConnectors\Connectors\LinkedInConnector;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class PublishVariantJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(
        public string $dispatchId
    ) {}

    public function handle(PublishingOrchestratorService $orchestrator): void
    {
        $dispatch = PublishingDispatch::with(['contentVariant.contentItem', 'socialAccount'])->find($this->dispatchId);

        if (!$dispatch || $dispatch->status === 'cancelled') {
            return;
        }

        // 1. Emergency Circuit Breaker Check
        if ($orchestrator->isPaused($dispatch->organization_id)) {
            $dispatch->update([
                'status' => 'cancelled',
                'error_code' => 'EMERGENCY_CIRCUIT_BREAKER',
                'error_message' => 'Publishing aborted by emergency circuit breaker.',
            ]);
            $dispatch->contentVariant?->update(['publishing_status' => 'draft']);

            AuditLogger::log(
                'publishing.job_aborted_by_circuit_breaker',
                $dispatch,
                null,
                ['dispatch_id' => $dispatch->id],
                $dispatch->organization_id
            );
            return;
        }

        // 2. Distributed Idempotency Lock
        $lockKey = "publish_lock_{$dispatch->idempotency_key}";
        $lock = Cache::lock($lockKey, 120);

        if (!$lock->get()) {
            Log::info("PublishVariantJob lease conflict for idempotency key: {$dispatch->idempotency_key}");
            return;
        }

        try {
            // Re-check status inside lock to guarantee idempotency
            $dispatch->refresh();
            if ($dispatch->status === 'published') {
                return;
            }

            $dispatch->increment('attempts');
            $dispatch->update([
                'status' => 'processing',
                'dispatched_at' => Carbon::now(),
            ]);

            $account = $dispatch->socialAccount;
            if (!$account) {
                throw new RuntimeException("Target social account not found.");
            }

            if ($account->isExpired()) {
                $dispatch->update([
                    'status' => 'failed',
                    'error_code' => 'TOKEN_EXPIRED',
                    'error_message' => "Social account token is expired. Please re-authenticate.",
                ]);
                $dispatch->contentVariant?->update(['publishing_status' => 'failed']);
                return;
            }

            // 3. Resolve Platform Connector
            $connector = match ($account->platform) {
                'facebook' => new FacebookConnector(),
                'instagram' => new InstagramConnector(),
                'linkedin' => new LinkedInConnector(),
                default => throw new RuntimeException("Unsupported platform: {$account->platform}"),
            };

            // 4. Execute Remote Publish
            $response = $connector->publish($dispatch->payload_snapshot, [
                'access_token' => $account->access_token,
                'provider_id' => $account->provider_id,
                'metadata' => $account->metadata ?? [],
            ]);

            // 5. Successful State Settlement
            $postId = (string) ($response['id'] ?? $response['post_id'] ?? Str::ulid());
            $permalink = (string) ($response['url'] ?? $response['permalink'] ?? '');

            $dispatch->update([
                'status' => 'published',
                'platform_post_id' => $postId,
                'platform_permalink' => $permalink,
                'response_payload' => $response,
                'published_at' => Carbon::now(),
            ]);

            $dispatch->contentVariant?->update([
                'publishing_status' => 'published',
                'published_at' => Carbon::now(),
            ]);

            // If all variants for parent content item are published, update content item
            $remaining = ContentVariant::where('content_item_id', $dispatch->content_item_id)
                ->where('publishing_status', '!=', 'published')
                ->exists();

            if (!$remaining) {
                $dispatch->contentItem?->update(['status' => 'published']);
            }

            AuditLogger::log(
                'publishing.published',
                $dispatch,
                null,
                [
                    'platform' => $account->platform,
                    'post_id' => $postId,
                    'permalink' => $permalink,
                ],
                $dispatch->organization_id,
                $dispatch->workspace_id
            );

        } catch (Throwable $e) {
            Log::error("PublishVariantJob failed: {$e->getMessage()}", [
                'dispatch_id' => $dispatch->id,
                'attempt' => $dispatch->attempts,
            ]);

            $errorMessage = $e->getMessage();
            $isTransient = $this->isTransientError($errorMessage);

            if ($isTransient && $dispatch->attempts < $this->tries) {
                // Route to retry queue with exponential backoff + jitter
                $delaySec = (int) (pow(2, $dispatch->attempts) * 30 + rand(5, 15));

                $dispatch->update([
                    'status' => 'queued',
                    'queue_name' => 'publishing-retry',
                    'error_code' => 'TRANSIENT_RETRY',
                    'error_message' => $errorMessage,
                ]);

                self::dispatch($dispatch->id)
                    ->onQueue('publishing-retry')
                    ->delay(now()->addSeconds($delaySec));
            } else {
                // Dead Letter Queue / Failure Quarantine
                $dispatch->update([
                    'status' => 'failed',
                    'error_code' => $isTransient ? 'RETRIES_EXHAUSTED' : 'PUBLISH_REJECTED',
                    'error_message' => $errorMessage,
                ]);

                $dispatch->contentVariant?->update(['publishing_status' => 'failed']);

                AuditLogger::log(
                    'publishing.failed',
                    $dispatch,
                    null,
                    [
                        'error' => $errorMessage,
                        'attempts' => $dispatch->attempts,
                    ],
                    $dispatch->organization_id,
                    $dispatch->workspace_id
                );
            }
        } finally {
            if (isset($lock) && method_exists($lock, 'release')) {
                $lock->release();
            }
        }
    }

    /**
     * Determine if an error is transient (rate limit, timeout, temporary 5xx)
     */
    protected function isTransientError(string $message): bool
    {
        $transientKeywords = [
            'rate limit',
            'too many requests',
            '429',
            '503',
            '504',
            'timeout',
            'timed out',
            'temporarily unavailable',
        ];

        foreach ($transientKeywords as $keyword) {
            if (stripos($message, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }
}

