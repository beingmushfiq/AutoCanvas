<?php

namespace App\Modules\Automation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Automation\Models\BrandCadenceSetting;
use App\Modules\Automation\Services\AutonomousAutopilotEngine;
use App\Modules\Brand\Models\Brand;
use App\Modules\Research\Models\ContentFingerprint;
use App\Modules\Research\Models\DiscoveredSource;
use App\Modules\Research\Models\SourceCluster;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutopilotController extends Controller
{
    protected function currentOrgId(): ?string
    {
        return app()->has('current_organization_id') ? app('current_organization_id') : null;
    }

    protected function resolveBrand(Request $request, ?string $brandId = null): Brand
    {
        $id = $brandId ?? $request->input('brand_id');
        $orgId = $this->currentOrgId();

        $query = Brand::query();
        if ($orgId) {
            $query->where('organization_id', $orgId);
        }

        if ($id) {
            return $query->findOrFail($id);
        }

        return $query->firstOrFail();
    }

    /**
     * Get or initialize brand cadence settings.
     */
    public function getCadence(Request $request): JsonResponse
    {
        $brand = $this->resolveBrand($request);

        $cadence = BrandCadenceSetting::firstOrCreate(
            ['brand_id' => $brand->id],
            [
                'organization_id' => $brand->organization_id,
                'workspace_id' => $brand->workspace_id,
                'autopilot_mode' => 'copilot_manual',
                'weekly_schedule' => [
                    ['day' => 'mon', 'time' => '10:00', 'channel' => 'linkedin'],
                    ['day' => 'wed', 'time' => '14:00', 'channel' => 'facebook'],
                    ['day' => 'fri', 'time' => '18:00', 'channel' => 'instagram'],
                ],
                'novelty_threshold_cosine' => 0.720,
                'max_daily_posts_per_channel' => 2,
                'require_consensus_for_breaking_news' => true,
                'is_active' => true,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $cadence,
        ]);
    }

    /**
     * Update brand cadence settings.
     */
    public function updateCadence(Request $request): JsonResponse
    {
        $brand = $this->resolveBrand($request);

        $validated = $request->validate([
            'autopilot_mode' => 'required|in:copilot_manual,assisted_autopilot,full_autonomous',
            'weekly_schedule' => 'required|array',
            'novelty_threshold_cosine' => 'nullable|numeric|min:0.5|max:0.95',
            'max_daily_posts_per_channel' => 'nullable|integer|min:1|max:10',
            'require_consensus_for_breaking_news' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $cadence = BrandCadenceSetting::updateOrCreate(
            ['brand_id' => $brand->id],
            array_merge($validated, [
                'organization_id' => $brand->organization_id,
                'workspace_id' => $brand->workspace_id,
            ])
        );

        return response()->json([
            'success' => true,
            'message' => 'Cadence configuration updated successfully.',
            'data' => $cadence,
        ]);
    }

    /**
     * Real-time Autopilot Radar Telemetry.
     */
    public function radar(Request $request): JsonResponse
    {
        $brand = $this->resolveBrand($request);
        $cadence = BrandCadenceSetting::where('brand_id', $brand->id)->first();

        // 1. Discovered sources stats
        $totalSources = DiscoveredSource::where('brand_id', $brand->id)->count();
        $activeSources = DiscoveredSource::where('brand_id', $brand->id)->where('status', 'active')->count();

        // 2. Emerging story clusters
        $clusters = SourceCluster::where('brand_id', $brand->id)
            ->latest('momentum_score')
            ->take(6)
            ->get();

        // 3. Anti-duplication fingerprints
        $fingerprintsCount = ContentFingerprint::where('brand_id', $brand->id)->count();
        $recentFingerprints = ContentFingerprint::where('brand_id', $brand->id)
            ->latest()
            ->take(8)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'brand' => [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'industry' => $brand->industry,
                ],
                'cadence' => $cadence,
                'pulse' => [
                    'last_scoured_at' => $cadence?->last_cycle_run_at?->toIso8601String(),
                    'autopilot_mode' => $cadence?->autopilot_mode ?? 'copilot_manual',
                    'is_active' => $cadence?->is_active ?? true,
                    'total_sources' => $totalSources,
                    'active_sources' => $activeSources,
                    'fingerprints_registered' => $fingerprintsCount,
                ],
                'emerging_clusters' => $clusters,
                'recent_fingerprints' => $recentFingerprints,
            ],
        ]);
    }

    /**
     * Manually trigger an on-demand scouring and fulfillment cycle.
     */
    public function trigger(Request $request, AutonomousAutopilotEngine $engine): JsonResponse
    {
        $brand = $this->resolveBrand($request);
        $report = $engine->runCycle($brand);

        return response()->json([
            'success' => true,
            'message' => 'Autonomous cycle executed successfully.',
            'data' => $report,
        ]);
    }

    /**
     * List discovered sources for management.
     */
    public function discoveredSources(Request $request): JsonResponse
    {
        $brand = $this->resolveBrand($request);
        $sources = DiscoveredSource::where('brand_id', $brand->id)->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $sources,
        ]);
    }

    /**
     * List novelty fingerprints for anti-duplication audits.
     */
    public function fingerprints(Request $request): JsonResponse
    {
        $brand = $this->resolveBrand($request);
        $fingerprints = ContentFingerprint::where('brand_id', $brand->id)
            ->latest('published_or_scheduled_at')
            ->paginate(25);

        return response()->json([
            'success' => true,
            'data' => $fingerprints,
        ]);
    }
}

