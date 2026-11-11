<?php

namespace App\Modules\Analytics\Jobs;

use App\Modules\Analytics\Services\PostAnalyticsTelemetryService;
use App\Modules\Publishing\Models\ChannelDispatch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PollPostTelemetryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $channelDispatchId,
        public string $checkpoint = '24h'
    ) {}

    public function handle(PostAnalyticsTelemetryService $telemetryService): void
    {
        $channelDispatch = ChannelDispatch::with('dispatch')->find($this->channelDispatchId);

        if (!$channelDispatch || $channelDispatch->status !== 'published') {
            return;
        }

        // Mock realistic telemetry numbers for demonstrated dispatches
        $baseImpressions = rand(850, 4200);
        $baseEngagements = (int) round($baseImpressions * (rand(35, 75) / 1000));

        $metrics = [
            'impressions' => $baseImpressions,
            'likes' => (int) round($baseEngagements * 0.65),
            'comments' => (int) round($baseEngagements * 0.15),
            'shares' => (int) round($baseEngagements * 0.10),
            'clicks' => (int) round($baseEngagements * 0.10),
        ];

        $record = $telemetryService->recordTelemetry(
            $channelDispatch->organization_id,
            $channelDispatch->dispatch_id,
            $channelDispatch->channel,
            $metrics,
            $this->checkpoint,
            $channelDispatch->id
        );

        Log::info("Recorded telemetry checkpoint [{$this->checkpoint}] for ChannelDispatch [{$this->channelDispatchId}]. Rate: {$record->engagement_rate}%");
    }
}
