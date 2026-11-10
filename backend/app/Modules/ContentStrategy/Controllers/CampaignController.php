<?php

namespace App\Modules\ContentStrategy\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentStrategy\Models\Campaign;
use App\Modules\ContentStrategy\Services\CampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function __construct(
        protected CampaignService $campaignService
    ) {}

    /**
     * List campaigns for a brand.
     */
    public function index(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $campaigns = $brand->campaigns()
            ->with('pillar')
            ->withCount('contentItems')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $campaigns,
        ]);
    }

    /**
     * Create campaign.
     */
    public function store(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'content_pillar_id' => ['nullable', 'string'],
            'objective' => ['nullable', 'string', 'max:100'],
            'key_messaging' => ['nullable', 'string'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'in:planning,active,completed,paused'],
        ]);

        $campaign = $this->campaignService->createCampaign($brand, $validated);

        return response()->json([
            'success' => true,
            'data' => $campaign,
            'message' => 'Campaign created successfully.',
        ], 201);
    }

    /**
     * Update campaign.
     */
    public function update(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        $campaign = $brand->campaigns()->where('organization_id', $orgId)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'content_pillar_id' => ['nullable', 'string'],
            'objective' => ['nullable', 'string', 'max:100'],
            'key_messaging' => ['nullable', 'string'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:planning,active,completed,paused'],
        ]);

        $updated = $this->campaignService->updateCampaign($campaign, $validated);

        return response()->json([
            'success' => true,
            'data' => $updated,
            'message' => 'Campaign updated.',
        ]);
    }

    /**
     * Delete campaign.
     */
    public function destroy(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        $campaign = $brand->campaigns()->where('organization_id', $orgId)->findOrFail($id);

        $this->campaignService->deleteCampaign($campaign);

        return response()->json([
            'success' => true,
            'message' => 'Campaign deleted.',
        ]);
    }
}
