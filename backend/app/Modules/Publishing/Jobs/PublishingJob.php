<?php

namespace App\Modules\Publishing\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;

class PublishingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected string $organizationId,
        protected array $content,
        protected string $destination,
        protected string $idempotencyKey
    ) {}

    public function handle()
    {
        $lock = Redis::lock('publish_job_' . $this->idempotencyKey, 60);

        if (!$lock->get()) {
            return; // Already processing or done
        }

        $job = \App\Modules\Publishing\Models\PublishingJob::where('idempotency_key', $this->idempotencyKey)->first();

        try {
            // Retrieve social account and tokens
            $account = \App\Modules\SocialConnectors\Models\SocialAccount::where('organization_id', $this->organizationId)
                ->where('platform', $this->destination)
                ->firstOrFail();

            // Simple connector resolution - to be expanded
            $connector = match($this->destination) {
                'facebook' => new \App\Modules\SocialConnectors\Connectors\FacebookConnector(),
                'instagram' => new \App\Modules\SocialConnectors\Connectors\InstagramConnector(),
                'linkedin' => new \App\Modules\SocialConnectors\Connectors\LinkedInConnector(),
                default => throw new \Exception("Unsupported destination"),
            };

            $connector->publish($this->content, [
                'access_token' => $account->access_token,
                'provider_id' => $account->provider_id,
                'metadata' => $account->metadata ?? [],
            ]);

            $job->update(['status' => 'completed']);
        } catch (\Exception $e) {
            $job->update(['status' => 'failed']);
            \App\Modules\Publishing\Models\PublishingAttempt::create([
                'organization_id' => $this->organizationId,
                'publishing_job_id' => $job->id,
                'attempt_number' => $job->attempts()->count() + 1,
                'status' => 'failed',
                'error' => $e->getMessage(),
            ]);
        } finally {
            $lock->release();
        }
    }
}

