<?php

namespace App\Modules\ContentProduction\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentProduction\Services\ContentApprovalService;
use App\Modules\ContentProduction\Services\ContentGenerationService;
use App\Modules\ContentProduction\Services\ContentQAService;
use App\Modules\Organization\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentItemController extends Controller
{
    public function __construct(
        protected ContentGenerationService $generationService,
        protected ContentApprovalService $approvalService,
        protected ContentQAService $qaService
    ) {}

    /**
     * List content items for a brand.
     */
    public function index(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $query = $brand->contentItems()
            ->with(['pillar', 'campaign', 'variants'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('pillar_id')) {
            $query->where('content_pillar_id', $request->query('pillar_id'));
        }

        if ($request->has('campaign_id')) {
            $query->where('campaign_id', $request->query('campaign_id'));
        }

        $items = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'total' => $items->total(),
                'per_page' => $items->perPage(),
            ],
        ]);
    }

    /**
     * Create a manual content item draft.
     */
    public function store(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $wsId = app('current_workspace_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'concept' => ['required', 'string'],
            'content_pillar_id' => ['nullable', 'string'],
            'campaign_id' => ['nullable', 'string'],
        ]);

        $item = ContentItem::create([
            'organization_id' => $orgId,
            'workspace_id' => $wsId,
            'brand_id' => $brand->id,
            'content_pillar_id' => $validated['content_pillar_id'] ?? null,
            'campaign_id' => $validated['campaign_id'] ?? null,
            'created_by_user_id' => $request->user()?->id,
            'title' => $validated['title'],
            'concept' => $validated['concept'],
            'status' => 'draft',
            'risk_level' => 'low',
            'overall_quality_score' => 80,
        ]);

        AuditLogger::log('content.created', $item, null, ['title' => $item->title], $orgId, $wsId);

        return response()->json([
            'success' => true,
            'data' => $item->load(['pillar', 'campaign', 'variants']),
            'message' => 'Draft content created successfully.',
        ], 201);
    }

    /**
     * Show full content item details.
     */
    public function show(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        $item = $brand->contentItems()
            ->with(['pillar', 'campaign', 'variants', 'createdBy', 'reviewedBy'])
            ->where('organization_id', $orgId)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    /**
     * Update content item.
     */
    public function update(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        $item = $brand->contentItems()->where('organization_id', $orgId)->findOrFail($id);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'concept' => ['sometimes', 'string'],
            'content_pillar_id' => ['nullable', 'string'],
            'campaign_id' => ['nullable', 'string'],
        ]);

        $item->update($validated);

        return response()->json([
            'success' => true,
            'data' => $item->fresh(['pillar', 'campaign', 'variants']),
            'message' => 'Content updated.',
        ]);
    }

    /**
     * Delete content item.
     */
    public function destroy(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        $item = $brand->contentItems()->where('organization_id', $orgId)->findOrFail($id);

        AuditLogger::log('content.deleted', $item, ['title' => $item->title], null, $orgId);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Content item removed.',
        ]);
    }

    /**
     * Trigger AI multi-channel post generation.
     */
    public function generate(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $validated = $request->validate([
            'topic' => ['required', 'string', 'max:500'],
            'content_pillar_id' => ['nullable', 'string'],
            'campaign_id' => ['nullable', 'string'],
            'platforms' => ['nullable', 'array'],
            'platforms.*' => ['string', 'in:linkedin,facebook,instagram,twitter,threads'],
            'generate_creative' => ['nullable', 'boolean'],
            'use_knowledge' => ['nullable', 'boolean'],
        ]);

        $item = $this->generationService->generate($brand, $validated, $request->user());

        return response()->json([
            'success' => true,
            'data' => $item,
            'message' => 'Autonomous content generated with multi-channel variants.',
        ], 201);
    }

    /**
     * Re-run QA evaluation on an item.
     */
    public function evaluateQa(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        $item = $brand->contentItems()->with('variants')->where('organization_id', $orgId)->findOrFail($id);

        $variantsData = [];
        foreach ($item->variants as $variant) {
            $variantsData[$variant->platform] = [
                'caption' => $variant->caption,
            ];
        }

        $report = $this->qaService->evaluateContent($brand, $variantsData, $item->concept);

        $item->update([
            'risk_level' => $report['risk_level'] ?? 'low',
            'overall_quality_score' => $report['overall_quality_score'] ?? 85,
            'qa_report' => $report,
        ]);

        return response()->json([
            'success' => true,
            'data' => $item->fresh(),
            'message' => 'QA evaluation refreshed.',
        ]);
    }

    /**
     * Submit for approval review.
     */
    public function submitReview(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        $item = $brand->contentItems()->where('organization_id', $orgId)->findOrFail($id);

        $updated = $this->approvalService->submitForReview($item, $request->user());

        return response()->json([
            'success' => true,
            'data' => $updated,
            'message' => 'Post submitted for review.',
        ]);
    }

    /**
     * Approve content item.
     */
    public function approve(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        $item = $brand->contentItems()->where('organization_id', $orgId)->findOrFail($id);

        $updated = $this->approvalService->approve($item, $request->user());

        return response()->json([
            'success' => true,
            'data' => $updated,
            'message' => 'Content approved and ready for scheduling.',
        ]);
    }

    /**
     * Reject content item.
     */
    public function reject(Request $request, string $brandId, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        $item = $brand->contentItems()->where('organization_id', $orgId)->findOrFail($id);

        $validated = $request->validate([
            'feedback' => ['required', 'string', 'max:1000'],
        ]);

        $updated = $this->approvalService->reject($item, $request->user(), $validated['feedback']);

        return response()->json([
            'success' => true,
            'data' => $updated,
            'message' => 'Content marked as rejected with review feedback.',
        ]);
    }
}
