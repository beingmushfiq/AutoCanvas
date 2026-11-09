<?php

namespace App\Modules\Brand\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\Brand\Models\BrandMemoryEntry;
use App\Modules\Organization\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandMemoryController extends Controller
{
    /**
     * List persistent memory entries for a brand.
     */
    public function index(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $entries = $brand->memoryEntries()->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data' => $entries->map(fn ($e) => [
                'id' => $e->id,
                'category' => $e->category,
                'title' => $e->title,
                'content' => $e->content,
                'confidence_score' => $e->confidence_score,
                'created_at' => $e->created_at->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Record a new verified fact or memory entry.
     */
    public function store(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $validated = $request->validate([
            'category' => ['required', 'string', 'in:approved_fact,successful_style,failed_experiment,audience_insight,campaign_milestone'],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'confidence_score' => ['nullable', 'numeric', 'min:0', 'max:1'],
        ]);

        $entry = BrandMemoryEntry::create([
            'brand_id' => $brand->id,
            'organization_id' => $orgId,
            'category' => $validated['category'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'confidence_score' => $validated['confidence_score'] ?? 1.00,
        ]);

        AuditLogger::log('brand.memory_created', $entry, null, ['title' => $entry->title], $orgId);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $entry->id,
                'category' => $entry->category,
                'title' => $entry->title,
            ],
            'message' => 'Brand memory entry recorded.',
        ], 201);
    }

    /**
     * Delete memory entry.
     */
    public function destroy(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $entry = BrandMemoryEntry::where('brand_id', $brand->id)
            ->where('organization_id', $orgId)
            ->findOrFail($id);

        $entry->delete();

        return response()->json([
            'success' => true,
            'message' => 'Memory entry removed.',
        ]);
    }
}
