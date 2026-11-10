<?php

namespace App\Modules\Creative\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\Creative\Services\CreativeRenderingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreativeStudioController extends Controller
{
    public function __construct(
        protected CreativeRenderingService $renderingService
    ) {}

    /**
     * List available creative layout templates.
     */
    public function templates(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->renderingService->getTemplates(),
        ]);
    }

    /**
     * Render creative graphic on the fly.
     */
    public function render(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');

        $validated = $request->validate([
            'brand_id' => ['required', 'string'],
            'headline' => ['required', 'string', 'max:255'],
            'supporting_text' => ['nullable', 'string', 'max:500'],
            'call_to_action' => ['nullable', 'string', 'max:100'],
            'template_id' => ['nullable', 'string'],
            'width' => ['nullable', 'integer', 'min:300', 'max:3840'],
            'height' => ['nullable', 'integer', 'min:300', 'max:3840'],
            'background_color' => ['nullable', 'string', 'max:20'],
        ]);

        $brand = Brand::where('organization_id', $orgId)->findOrFail($validated['brand_id']);

        $result = $this->renderingService->render($brand, $validated);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Render creative and attach to a specific content variant.
     */
    public function renderForVariant(Request $request, string $variantId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $variant = ContentVariant::with('contentItem.brand')->where('organization_id', $orgId)->findOrFail($variantId);
        $brand = $variant->contentItem->brand;

        $validated = $request->validate([
            'headline' => ['required', 'string', 'max:255'],
            'supporting_text' => ['nullable', 'string', 'max:500'],
            'call_to_action' => ['nullable', 'string', 'max:100'],
            'template_id' => ['nullable', 'string'],
            'width' => ['nullable', 'integer'],
            'height' => ['nullable', 'integer'],
        ]);

        $result = $this->renderingService->render($brand, $validated);

        // Attach to variant media
        $media = $variant->media_urls ?? [];
        $media[] = $result['file_url'];

        $variant->update([
            'media_urls' => array_values(array_unique($media)),
            'creative_document' => $result['creative_document'],
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'variant' => $variant->fresh(),
                'rendered_asset' => $result,
            ],
            'message' => 'Creative rendered and attached to variant.',
        ]);
    }
}
