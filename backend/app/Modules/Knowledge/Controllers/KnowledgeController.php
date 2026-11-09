<?php

namespace App\Modules\Knowledge\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\Knowledge\Services\BrandKnowledgeRetrievalService;
use App\Modules\Knowledge\Services\KnowledgeIngestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KnowledgeController extends Controller
{
    public function __construct(
        protected KnowledgeIngestionService $ingestionService,
        protected BrandKnowledgeRetrievalService $retrievalService
    ) {}

    /**
     * List all knowledge sources for a brand.
     */
    public function index(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $sources = $brand->knowledgeSources()->withCount('chunks')->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data' => $sources->map(fn ($s) => [
                'id' => $s->id,
                'source_type' => $s->source_type,
                'display_name' => $s->display_name,
                'original_uri' => $s->original_uri,
                'credibility' => $s->credibility,
                'status' => $s->status,
                'chunks_count' => $s->chunks_count,
                'created_at' => $s->created_at->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Ingest raw text or uploaded document content.
     */
    public function upload(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'max:10240'], // 10MB max
            'credibility' => ['nullable', 'string', 'in:A,B,C,D,E'],
        ]);

        $content = $validated['content'] ?? '';

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $content = file_get_contents($file->getRealPath());
        }

        if (empty(trim($content))) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'EMPTY_CONTENT',
                    'message' => 'Please provide text content or a file to ingest.',
                ],
            ], 422);
        }

        $source = $this->ingestionService->ingestText(
            $brand,
            $validated['title'],
            $content,
            $request->hasFile('file') ? 'pdf' : 'raw_text',
            $validated['credibility'] ?? 'A'
        );

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $source->id,
                'display_name' => $source->display_name,
                'credibility' => $source->credibility,
                'chunks_count' => $source->chunks()->count(),
            ],
            'message' => 'Knowledge source successfully ingested and chunked.',
        ], 201);
    }

    /**
     * Ingest a public URL into the brand knowledge base with SSRF defense.
     */
    public function submitUrl(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $validated = $request->validate([
            'url' => ['required', 'url', 'max:1000'],
        ]);

        $source = $this->ingestionService->ingestUrl($brand, $validated['url']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $source->id,
                'display_name' => $source->display_name,
                'credibility' => $source->credibility,
                'chunks_count' => $source->chunks()->count(),
            ],
            'message' => 'Website content successfully fetched and indexed into brand knowledge.',
        ], 201);
    }

    /**
     * Search brand-scoped knowledge chunks.
     */
    public function search(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $validated = $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:500'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $results = $this->retrievalService->search(
            $brand,
            $validated['query'],
            $validated['limit'] ?? 5
        );

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }
}
