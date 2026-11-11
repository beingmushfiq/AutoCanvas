<?php

namespace App\Modules\ControlPlane\Services;

use App\AI\Models\AiUsageRecord;
use App\Models\User;
use App\Modules\Billing\Models\Subscription;
use App\Modules\Brand\Models\Brand;
use App\Modules\Organization\Models\Organization;
use App\Modules\Publishing\Models\PublishingJob;
use App\Modules\Workspace\Models\Workspace;

class PlatformMetricsService
{
    /**
     * Compute real-time platform telemetry for the Master Control Panel.
     */
    public function getMetrics(): array
    {
        // 1. Financial Metrics (MRR & ARR based on active subscriptions)
        $activeSubscriptions = Subscription::with('plan')
            ->where('status', 'active')
            ->get();

        $mrr = 0.00;
        foreach ($activeSubscriptions as $sub) {
            if ($sub->plan) {
                $mrr += (float) $sub->plan->price_monthly;
            }
        }
        $arr = round($mrr * 12, 2);

        // 2. Tenancy Metrics
        $totalOrgs = Organization::withoutGlobalScopes()->count();
        $activeOrgs = Organization::withoutGlobalScopes()->where('status', 'active')->count();
        $suspendedOrgs = Organization::withoutGlobalScopes()->where('status', 'suspended')->count();
        $delinquentOrgs = Organization::withoutGlobalScopes()->where('status', 'delinquent')->count();
        $totalWorkspaces = Workspace::withoutGlobalScopes()->count();
        $totalBrands = Brand::withoutGlobalScopes()->count();
        $totalUsers = User::count();

        // 3. Publishing Engine Metrics (last 24 hours)
        $completed24h = PublishingJob::where('status', 'completed')
            ->where('updated_at', '>=', now()->subDay())
            ->count();

        $failed24h = PublishingJob::where('status', 'failed')
            ->where('updated_at', '>=', now()->subDay())
            ->count();

        $pendingBacklog = PublishingJob::whereIn('status', ['scheduled', 'queued', 'processing'])->count();

        $totalAttempts24h = $completed24h + $failed24h;
        $successRate = $totalAttempts24h > 0
            ? round(($completed24h / $totalAttempts24h) * 100, 1)
            : 100.0;

        // 4. AI Infrastructure Telemetry
        $aiInputTokens24h = (int) AiUsageRecord::where('created_at', '>=', now()->subDay())->sum('input_tokens');
        $aiOutputTokens24h = (int) AiUsageRecord::where('created_at', '>=', now()->subDay())->sum('output_tokens');
        $aiCost24h = round((float) AiUsageRecord::where('created_at', '>=', now()->subDay())->sum('estimated_cost_usd'), 4);
        $aiCostAllTime = round((float) AiUsageRecord::sum('estimated_cost_usd'), 4);

        return [
            'financial' => [
                'mrr_usd' => round($mrr, 2),
                'arr_usd' => $arr,
                'active_subscriptions_count' => $activeSubscriptions->count(),
            ],
            'tenancy' => [
                'total_organizations' => $totalOrgs,
                'active_organizations' => $activeOrgs,
                'suspended_organizations' => $suspendedOrgs,
                'delinquent_organizations' => $delinquentOrgs,
                'total_workspaces' => $totalWorkspaces,
                'total_brands' => $totalBrands,
                'total_users' => $totalUsers,
            ],
            'publishing' => [
                'completed_24h' => $completed24h,
                'failed_24h' => $failed24h,
                'pending_backlog' => $pendingBacklog,
                'success_rate_percentage' => $successRate,
            ],
            'ai_infrastructure' => [
                'input_tokens_24h' => $aiInputTokens24h,
                'output_tokens_24h' => $aiOutputTokens24h,
                'estimated_cost_usd_24h' => $aiCost24h,
                'estimated_cost_usd_all_time' => $aiCostAllTime,
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}

