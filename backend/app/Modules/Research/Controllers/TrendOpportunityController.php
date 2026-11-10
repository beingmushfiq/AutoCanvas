<?php

namespace App\Modules\Research\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\Research\Models\ContentOpportunity;
use App\Modules\Research\Models\TrendSignal;
use App\Modules\Research\Services\TrendAnalysisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrendOpportunityController extends Controller
{
    /**
     * List opportunities for a brand with optional status filtering.
     */
    public function index(Request $request, string $brandId): JsonResponse
    {
        $brand = Brand::findOrFail($brandId);

        $status = $request->query('status', 'new');

        $opportunities = ContentOpportunity::where('brand_id', $brand->id)
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->with(['pillar:id,name,color_tag,weight_percentage', 'article:id,title,url,summary,published_at'])
            ->orderBy('overall_opportunity_score', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $opportunities,
        ]);
    }

    /**
     * Trigger AI trend detection and opportunity radar scan.
     */
    public function detect(Request $request, string $brandId, TrendAnalysisService $service): JsonResponse
    {
        $brand = Brand::findOrFail($brandId);

        $limit = $request->integer('limit', 5);
        $opportunities = $service->detectOpportunities($brand, ['limit' => $limit]);

        $ids = $opportunities->pluck('id');
        $reloaded = ContentOpportunity::whereIn('id', $ids)
            ->with(['pillar:id,name,color_tag', 'article:id,title,url'])
            ->get();

        return response()->json([
            'success' => true,
            'message' => "Detected {$opportunities->count()} new content opportunities.",
            'data' => $reloaded,
        ], 201);
    }

    /**
     * Convert an opportunity into a drafted ContentItem with multi-platform variants.
     */
    public function convert(Request $request, string $opportunityId, TrendAnalysisService $service): JsonResponse
    {
        $opportunity = ContentOpportunity::findOrFail($opportunityId);

        $overrides = $request->only(['platforms', 'generate_creative', 'use_knowledge']);

        $contentItem = $service->convertOpportunityToPost($opportunity, $request->user(), $overrides);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity successfully converted into a draft campaign post.',
            'data' => [
                'opportunity' => $opportunity->fresh(),
                'content_item' => $contentItem->load(['variants', 'pillar']),
            ],
        ], 201);
    }

    /**
     * Dismiss an opportunity from the radar.
     */
    public function dismiss(string $opportunityId, TrendAnalysisService $service): JsonResponse
    {
        $opportunity = ContentOpportunity::findOrFail($opportunityId);
        $service->dismissOpportunity($opportunity);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity dismissed.',
        ]);
    }

    /**
     * List active trend signals for the brand / workspace.
     */
    public function trends(string $brandId): JsonResponse
    {
        $brand = Brand::findOrFail($brandId);

        $trends = TrendSignal::where('brand_id', $brand->id)
            ->orWhereNull('brand_id')
            ->where('status', 'active')
            ->orderBy('signal_strength', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $trends,
        ]);
    }
}
