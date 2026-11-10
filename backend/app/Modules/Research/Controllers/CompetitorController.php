<?php

namespace App\Modules\Research\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\Research\Models\CompetitorPost;
use App\Modules\Research\Models\CompetitorProfile;
use App\Modules\Research\Services\CompetitorTrackerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompetitorController extends Controller
{
    /**
     * List all competitors for a brand.
     */
    public function index(string $brandId): JsonResponse
    {
        $brand = Brand::findOrFail($brandId);

        $competitors = CompetitorProfile::where('brand_id', $brand->id)
            ->withCount('posts')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $competitors,
        ]);
    }

    /**
     * Register a new competitor.
     */
    public function store(Request $request, string $brandId, CompetitorTrackerService $service): JsonResponse
    {
        $brand = Brand::findOrFail($brandId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'website_url' => 'nullable|url|max:500',
            'social_handles' => 'nullable|array',
            'strengths' => 'nullable|string',
            'weaknesses' => 'nullable|string',
            'target_audience' => 'nullable|string|max:255',
            'observation_frequency' => 'nullable|in:daily,weekly,monthly',
        ]);

        $competitor = $service->createCompetitor($brand, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Competitor profile registered.',
            'data' => $competitor,
        ], 201);
    }

    /**
     * Update competitor profile details.
     */
    public function update(Request $request, string $competitorId, CompetitorTrackerService $service): JsonResponse
    {
        $competitor = CompetitorProfile::findOrFail($competitorId);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'website_url' => 'nullable|url|max:500',
            'social_handles' => 'nullable|array',
            'strengths' => 'nullable|string',
            'weaknesses' => 'nullable|string',
            'target_audience' => 'nullable|string|max:255',
            'observation_frequency' => 'nullable|in:daily,weekly,monthly',
            'status' => 'nullable|in:active,paused,archived',
        ]);

        $updated = $service->updateCompetitor($competitor, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Competitor profile updated.',
            'data' => $updated,
        ]);
    }

    /**
     * Remove / soft-delete a competitor.
     */
    public function destroy(string $competitorId): JsonResponse
    {
        $competitor = CompetitorProfile::findOrFail($competitorId);
        $competitor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Competitor archived.',
        ]);
    }

    /**
     * List observed posts for a specific competitor.
     */
    public function posts(string $competitorId): JsonResponse
    {
        $competitor = CompetitorProfile::findOrFail($competitorId);

        $posts = CompetitorPost::where('competitor_profile_id', $competitor->id)
            ->orderBy('published_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $posts,
        ]);
    }

    /**
     * Log a new post observation for a competitor.
     */
    public function logPost(Request $request, string $competitorId, CompetitorTrackerService $service): JsonResponse
    {
        $competitor = CompetitorProfile::findOrFail($competitorId);

        $validated = $request->validate([
            'platform' => 'required|in:linkedin,facebook,instagram,twitter,tiktok,youtube,other',
            'post_url' => 'nullable|url|max:1000',
            'post_text' => 'required|string',
            'published_at' => 'nullable|date',
            'engagement_signals' => 'nullable|array',
            'observed_themes' => 'nullable|array',
            'tone' => 'nullable|string|max:50',
            'tactical_takeaway' => 'nullable|string',
        ]);

        $post = $service->logPost($competitor, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Competitor post observation recorded.',
            'data' => $post,
        ], 201);
    }

    /**
     * Return aggregated insights (cadence, top themes, platform distribution).
     */
    public function insights(string $brandId, CompetitorTrackerService $service): JsonResponse
    {
        $brand = Brand::findOrFail($brandId);

        $insights = $service->getInsights($brand);

        return response()->json([
            'success' => true,
            'data' => $insights,
        ]);
    }
}
