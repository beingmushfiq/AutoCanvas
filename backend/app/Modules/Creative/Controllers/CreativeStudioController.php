<?php

namespace App\Modules\Creative\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\Creative\Models\CreativeDocument;
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
     * List creative documents for a brand.
     */
    public function index(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $documents = CreativeDocument::where('brand_id', $brand->id)
            ->where('organization_id', $orgId)
            ->orderBy('created_at', 'desc')
            ->paginate(24);

        return response()->json([
            'success' => true,
            'data' => $documents->items(),
            'meta' => [
                'current_page' => $documents->currentPage(),
                'total' => $documents->total(),
            ],
        ]);
    }

    /**
     * Save a new creative document.
     */
    public function store(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $wsId = app('current_workspace_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'template_id' => ['nullable', 'string'],
            'aspect_ratio' => ['nullable', 'string'],
            'width' => ['nullable', 'integer', 'min:200', 'max:4000'],
            'height' => ['nullable', 'integer', 'min:200', 'max:4000'],
            'layers' => ['required', 'array'],
            'background_config' => ['nullable', 'array'],
        ]);

        $doc = CreativeDocument::create([
            'organization_id' => $orgId,
            'workspace_id' => $wsId,
            'brand_id' => $brand->id,
            'name' => $validated['name'],
            'template_id' => $validated['template_id'] ?? 'minimal_corporate_v1',
            'aspect_ratio' => $validated['aspect_ratio'] ?? '1:1',
            'width' => $validated['width'] ?? 1080,
            'height' => $validated['height'] ?? 1080,
            'layers' => $validated['layers'],
            'background_config' => $validated['background_config'] ?? ['color' => '#101828'],
            'render_status' => 'draft',
        ]);

        return response()->json([
            'success' => true,
            'data' => $doc,
            'message' => 'Creative document saved successfully.',
        ], 201);
    }

    /**
     * Show single creative document.
     */
    public function show(string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $doc = CreativeDocument::where('organization_id', $orgId)->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $doc,
        ]);
    }

    /**
     * Update an existing creative document.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $doc = CreativeDocument::where('organization_id', $orgId)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'template_id' => ['nullable', 'string'],
            'aspect_ratio' => ['nullable', 'string'],
            'width' => ['nullable', 'integer'],
            'height' => ['nullable', 'integer'],
            'layers' => ['nullable', 'array'],
            'background_config' => ['nullable', 'array'],
        ]);

        $doc->update($validated);

        return response()->json([
            'success' => true,
            'data' => $doc->fresh(),
            'message' => 'Creative document updated successfully.',
        ]);
    }

    /**
     * Trigger rendering for an existing creative document.
     */
    public function renderDocument(string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $doc = CreativeDocument::with('brand')->where('organization_id', $orgId)->findOrFail($id);

        $renderedDoc = $this->renderingService->renderDocument($doc);

        return response()->json([
            'success' => true,
            'data' => $renderedDoc,
            'message' => 'Creative rendered successfully.',
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

    /**
     * Delete creative document.
     */
    public function destroy(string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $doc = CreativeDocument::where('organization_id', $orgId)->findOrFail($id);
        $doc->delete();

        return response()->json([
            'success' => true,
            'message' => 'Creative document deleted successfully.',
        ]);
    }
}
