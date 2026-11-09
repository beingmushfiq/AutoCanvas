<?php

namespace App\Modules\Brand\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\Brand\Services\BrandDiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandDiscoveryController extends Controller
{
    public function __construct(
        protected BrandDiscoveryService $discoveryService
    ) {}

    /**
     * Trigger AI brand discovery analysis from text or website notes.
     */
    public function discover(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $validated = $request->validate([
            'text' => ['nullable', 'string'],
        ]);

        $referenceText = $validated['text'] ?? null;

        // If no explicit text provided, gather excerpts from brand knowledge chunks
        if (empty($referenceText)) {
            $chunks = $brand->sourceChunks()->take(10)->pluck('content')->implode("\n\n");
            $referenceText = $chunks;
        }

        if (empty(trim($referenceText))) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NO_REFERENCE_MATERIAL',
                    'message' => 'Please provide brand guidelines text or ingest knowledge sources first.',
                ],
            ], 422);
        }

        $result = $this->discoveryService->discoverFromText($brand, $referenceText);

        return response()->json([
            'success' => true,
            'data' => $result['discovered_profile'],
            'meta' => $result['meta'],
        ]);
    }
}
