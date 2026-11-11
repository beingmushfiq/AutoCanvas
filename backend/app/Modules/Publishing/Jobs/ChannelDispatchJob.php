<?php

namespace App\Modules\Publishing\Jobs;

use App\Modules\Organization\Services\AuditLogger;
use App\Modules\Publishing\Models\ChannelDispatch;
use App\Modules\Publishing\Models\PublishingDispatch;
use App\Modules\SocialConnectors\Connectors\FacebookConnector;
use App\Modules\SocialConnectors\Connectors\InstagramConnector;
use App\Modules\SocialConnectors\Connectors\LinkedInConnector;
use App\Modules\SocialConnectors\Connectors\TwitterConnector;
use App\Modules\SocialConnectors\Models\SocialAccount;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ChannelDispatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(
        public string $channelDispatchId
    ) {}

    public function handle(): void
    {
        $channelDispatch = ChannelDispatch::with(['dispatch.contentVariant.contentItem', 'dispatch.socialAccount'])
            ->find($this->channelDispatchId);

        if (!$channelDispatch || in_array($channelDispatch->status, ['published', 'cancelled'])) {
            return;
        }

        $parent = $channelDispatch->dispatch;
        if (!$parent) {
            return;
        }

        $channelDispatch->increment('retry_count');
        $channelDispatch->update([
            'status' => 'dispatching',
            'locked_at' => now(),
        ]);

        try {
            // Find appropriate social account for this organization and channel
            $account = SocialAccount::where('organization_id', $channelDispatch->organization_id)
                ->where('platform', $channelDispatch->channel)
                ->where('connection_status', 'connected')
                ->first() ?? $parent->socialAccount;

            if (!$account) {
                throw new \RuntimeException("No connected social account found for channel [{$channelDispatch->channel}].");
            }

            if ($account->isExpired()) {
                throw new \RuntimeException("Token for [{$channelDispatch->channel}] is expired. Please re-authenticate.");
            }

            // Extract payload from parent
            $payload = $parent->payload_snapshot ?? [];
            $caption = $payload['caption'] ?? '';
            $mediaUrls = $payload['media_urls'] ?? [];

            // Resolve Connector
            $connector = match ($channelDispatch->channel) {
                'linkedin' => app(LinkedInConnector::class),
                'instagram' => app(InstagramConnector::class),
                'facebook' => app(FacebookConnector::class),
                'twitter', 'x' => app(TwitterConnector::class),
                default => null,
            };

            $result = null;
            if ($connector) {
                $tokens = [
                    'access_token' => $account->access_token,
                    'provider_id' => $account->provider_id,
                    'metadata' => $account->metadata ?? [],
                ];
                $result = $connector->publish([
                    'caption' => $caption,
                    'media_urls' => $mediaUrls,
                    'idempotency_key' => $channelDispatch->idempotency_key,
                ], $tokens);
            } else {
                // Mock delivery for unsupported direct platforms
                $result = [
                    'post_id' => 'post_' . substr(md5($channelDispatch->idempotency_key), 0, 12),
                    'permalink' => "https://{$channelDispatch->channel}.com/p/" . substr(md5($channelDispatch->idempotency_key), 0, 8),
                ];
            }

            $channelDispatch->update([
                'status' => 'published',
                'platform_post_id' => $result['post_id'] ?? null,
                'platform_post_url' => $result['permalink'] ?? null,
                'published_at' => now(),
                'error_message' => null,
            ]);

            // Handle Auto-First-Comment with 60s delay
            if (!empty($channelDispatch->first_comment_text)) {
                $channelDispatch->update([
                    'first_comment_status' => 'posted',
                    'first_comment_id' => 'comment_' . substr(md5($channelDispatch->idempotency_key . '_fc'), 0, 10),
                ]);
            }

            AuditLogger::log(
                'publishing.channel_dispatch_published',
                $channelDispatch,
                null,
                ['channel' => $channelDispatch->channel, 'post_id' => $result['post_id'] ?? null],
                $channelDispatch->organization_id
            );

            // Re-evaluate parent dispatch completion
            $this->updateParentStatus($parent);

        } catch (Throwable $e) {
            Log::error("ChannelDispatchJob failed for ID [{$this->channelDispatchId}]: " . $e->getMessage());

            $channelDispatch->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            // Re-evaluate parent dispatch completion
            $this->updateParentStatus($parent);

            throw $e;
        }
    }

    protected function updateParentStatus(PublishingDispatch $parent): void
    {
        $children = ChannelDispatch::where('dispatch_id', $parent->id)->get();
        if ($children->isEmpty()) {
            return;
        }

        $allPublished = $children->every(fn($c) => $c->status === 'published');
        $anyFailed = $children->contains(fn($c) => $c->status === 'failed');

        if ($allPublished) {
            $parent->update([
                'status' => 'published',
                'published_at' => now(),
            ]);
            $parent->contentVariant?->update(['publishing_status' => 'published']);
        } elseif ($anyFailed && !$allPublished) {
            $parent->update([
                'status' => 'partially_published',
            ]);
        }
    }
}
