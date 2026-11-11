<?php

namespace App\Modules\Analytics\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Analytics\Services\AnalyticsAggregatorService;
use App\Modules\Analytics\Services\AnalyticsSyncService;
use App\Modules\Analytics\Services\SystemTelemetryService;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentVariant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    /**
     * Resolve active organization ID from request container.
     */
    protected function currentOrgId(): ?string
    {
        return app()->has('current_organization_id') ? app('current_organization_id') : null;
    }

    /**
     * High-level KPI summary with period-over-period comparisons.
     */
    public function overview(Request $request, string $id, AnalyticsAggregatorService $aggregator): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $brand = Brand::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($id);

        $startDate = Carbon::parse($request->input('start_date', Carbon::now()->subDays(29)->toDateString()));
        $endDate = Carbon::parse($request->input('end_date', Carbon::now()->toDateString()));

        $overview = $aggregator->getBrandOverview($brand, $startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $overview,
        ]);
    }

    /**
     * Contiguous daily time-series sequence for charts.
     */
    public function timeseries(Request $request, string $id, AnalyticsAggregatorService $aggregator): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $brand = Brand::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($id);

        $startDate = Carbon::parse($request->input('start_date', Carbon::now()->subDays(29)->toDateString()));
        $endDate = Carbon::parse($request->input('end_date', Carbon::now()->toDateString()));
        $platform = $request->input('platform');

        $timeseries = $aggregator->getTimeSeries($brand, $startDate, $endDate, $platform);

        return response()->json([
            'success' => true,
            'data' => $timeseries,
        ]);
    }

    /**
     * Strategic Content Pillar ROI and performance efficiency breakdown.
     */
    public function pillars(Request $request, string $id, AnalyticsAggregatorService $aggregator): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $brand = Brand::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($id);

        $startDate = Carbon::parse($request->input('start_date', Carbon::now()->subDays(29)->toDateString()));
        $endDate = Carbon::parse($request->input('end_date', Carbon::now()->toDateString()));

        $pillars = $aggregator->getPillarRoi($brand, $startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $pillars,
        ]);
    }

    /**
     * Peak engagement day and hour density matrix (7 x 24).
     */
    public function bestTimes(Request $request, string $id, AnalyticsAggregatorService $aggregator): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $brand = Brand::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($id);

        $bestTimes = $aggregator->getBestPostingTimes($brand);

        return response()->json([
            'success' => true,
            'data' => $bestTimes,
        ]);
    }

    /**
     * Top performing posts ranked by engagement rate.
     */
    public function topPosts(Request $request, string $id, AnalyticsAggregatorService $aggregator): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $brand = Brand::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($id);

        $limit = $request->integer('limit', 10);
        $topPosts = $aggregator->getTopPosts($brand, $limit);

        return response()->json([
            'success' => true,
            'data' => $topPosts,
        ]);
    }

    /**
     * Manually ingest or update performance metrics for a specific variant.
     */
    public function recordMetrics(Request $request, string $variantId, AnalyticsSyncService $syncService): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $variant = ContentVariant::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($variantId);

        $validated = $request->validate([
            'likes' => 'nullable|integer|min:0',
            'comments' => 'nullable|integer|min:0',
            'shares' => 'nullable|integer|min:0',
            'clicks' => 'nullable|integer|min:0',
            'impressions' => 'nullable|integer|min:0',
            'reach' => 'nullable|integer|min:0',
            'platform_post_id' => 'nullable|string|max:255',
        ]);

        $postAnalytics = $syncService->syncPostMetrics($variant, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Post metrics recorded.',
            'data' => $postAnalytics,
        ]);
    }

    /**
     * Record a daily snapshot rollup for testing or offline metric imports.
     */
    public function recordSnapshot(Request $request, string $brandId, AnalyticsSyncService $syncService): JsonResponse
    {
        $orgId = $this->currentOrgId();
        $brand = Brand::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->findOrFail($brandId);

        $validated = $request->validate([
            'snapshot_date' => 'required|date',
            'impressions' => 'required|integer|min:0',
            'reach' => 'nullable|integer|min:0',
            'engagements' => 'required|integer|min:0',
            'clicks' => 'nullable|integer|min:0',
            'video_views' => 'nullable|integer|min:0',
            'net_follower_change' => 'nullable|integer',
            'platform' => 'nullable|string|in:facebook,instagram,linkedin,twitter,all',
        ]);

        $snapshot = $syncService->recordDailySnapshot(
            $brand,
            null,
            $validated,
            Carbon::parse($validated['snapshot_date'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Daily analytics snapshot recorded.',
            'data' => $snapshot,
        ], 201);
    }

    /**
     * System-wide operational telemetry endpoint.
     */
    public function telemetry(SystemTelemetryService $service): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $service->getTelemetry(),
        ]);
    }
}

