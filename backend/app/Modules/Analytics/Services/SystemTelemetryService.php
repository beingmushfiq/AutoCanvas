<?php

namespace App\Modules\Analytics\Services;

use App\Modules\ControlPlane\Services\SystemSettingsService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SystemTelemetryService
{
    public function __construct(
        protected ?SystemSettingsService $settingsService = null
    ) {
        $this->settingsService = $settingsService ?? app(SystemSettingsService::class);
    }

    /**
     * Gather comprehensive operational telemetry for workers, queues, and budgets.
     */
    public function getTelemetry(): array
    {
        $failedJobsCount = 0;
        try {
            $failedJobsCount = DB::table('failed_jobs')->count();
        } catch (\Throwable) {
            // In case failed_jobs table not present in sqlite test
        }

        $queueDepthHigh = 0;
        $queueDepthNormal = 0;
        $queueDepthRetry = 0;
        try {
            if (DB::getSchemaBuilder()->hasTable('jobs')) {
                $queueDepthHigh = DB::table('jobs')->where('queue', 'publishing-high')->count();
                $queueDepthNormal = DB::table('jobs')->where('queue', 'publishing-normal')->count();
                $queueDepthRetry = DB::table('jobs')->where('queue', 'publishing-retry')->count();
            }
        } catch (\Throwable) {
            // Fallback
        }

        $aiTokensToday = 0;
        $aiCostToday = 0.0;
        try {
            if (DB::getSchemaBuilder()->hasTable('ai_usage_records')) {
                $todayUsage = DB::table('ai_usage_records')
                    ->whereDate('created_at', Carbon::today())
                    ->selectRaw('COALESCE(SUM(total_tokens), 0) as tokens, COALESCE(SUM(estimated_cost_usd), 0) as cost')
                    ->first();
                $aiTokensToday = (int) ($todayUsage->tokens ?? 0);
                $aiCostToday = round((float) ($todayUsage->cost ?? 0.0), 4);
            }
        } catch (\Throwable) {
            // Fallback
        }

        $isPaused = $this->settingsService ? (bool) $this->settingsService->get('pause_all_automations', false) : false;

        return [
            'timestamp' => Carbon::now()->toIso8601String(),
            'circuit_breaker' => [
                'is_paused' => $isPaused,
                'status' => $isPaused ? 'HALTED' : 'OPERATIONAL',
            ],
            'queues' => [
                'publishing_high_depth' => $queueDepthHigh,
                'publishing_normal_depth' => $queueDepthNormal,
                'publishing_retry_depth' => $queueDepthRetry,
                'total_queued' => $queueDepthHigh + $queueDepthNormal + $queueDepthRetry,
                'dead_letter_queue_count' => $failedJobsCount,
            ],
            'ai_telemetry' => [
                'tokens_consumed_today' => $aiTokensToday,
                'estimated_cost_usd_today' => $aiCostToday,
            ],
            'system_health' => [
                'status' => $failedJobsCount > 50 ? 'DEGRADED' : 'HEALTHY',
                'php_version' => PHP_VERSION,
                'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
            ],
        ];
    }
}
