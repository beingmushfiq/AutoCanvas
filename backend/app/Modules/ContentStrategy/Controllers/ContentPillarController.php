<?php

namespace App\Modules\ContentStrategy\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentStrategy\Services\ContentPillarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentPillarController extends Controller
{
    public function __construct(
        protected ContentPillarService $pillarService
    ) {}

    /**
     * List content pillars for a brand.
     */
    public function index(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $pillars = $brand->contentPillars()
            ->withCount('contentItems')
            ->orderBy('weight_percentage', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pillars,
        ]);
    }

    /**
     * Create content pillar.
     */
    public function store(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'target_audience' => ['nullable', 'string', 'max:255'],
            'weight_percentage' => ['nullable', 'integer', 'min:1', 'max:100'],
            'color_tag' => ['nullable', 'string', 'max:20'],
        ]);

        $pillar = $this->pillarService->createPillar($brand, $validated);

        return response()->json([
            'success' => true,
            'data' => $pillar,
            'message' => 'Content pillar created successfully.',
        ], 201);
    }

    /**
     * Update content pillar.
     */
    public function update(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        $pillar = $brand->contentPillars()->where('organization_id', $orgId)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'target_audience' => ['nullable', 'string', 'max:255'],
            'weight_percentage' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'color_tag' => ['sometimes', 'string', 'max:20'],
            'status' => ['sometimes', 'in:active,archived'],
        ]);

        $updated = $this->pillarService->updatePillar($pillar, $validated);

        return response()->json([
            'success' => true,
            'data' => $updated,
            'message' => 'Content pillar updated.',
        ]);
    }

    /**
     * Delete content pillar.
     */
    public function destroy(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        $pillar = $brand->contentPillars()->where('organization_id', $orgId)->findOrFail($id);

        $this->pillarService->deletePillar($pillar);

        return response()->json([
            'success' => true,
            'message' => 'Content pillar deleted.',
        ]);
    }
}
