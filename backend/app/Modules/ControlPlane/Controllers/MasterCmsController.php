<?php

namespace App\Modules\ControlPlane\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Services\MasterCmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MasterCmsController extends Controller
{
    public function __construct(
        protected MasterCmsService $cmsService
    ) {}

    /**
     * Public landing page CMS data (unauthenticated, cached).
     */
    public function publicData(): JsonResponse
    {
        $data = $this->cmsService->getPublicCmsData();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get all CMS blocks for the Master Control Panel.
     */
    public function getBlocks(): JsonResponse
    {
        $blocks = $this->cmsService->getAllBlocks();

        return response()->json([
            'success' => true,
            'data' => $blocks,
        ]);
    }

    /**
     * Update a specific CMS block by key.
     */
    public function updateBlock(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content_json' => 'required|array',
        ]);

        $block = $this->cmsService->updateBlock(
            $key,
            $validated['content_json'],
            $validated['title'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "CMS block '{$key}' updated successfully.",
            'data' => $block,
        ]);
    }

    /**
     * Flush public landing page CMS cache.
     */
    public function purgeCache(): JsonResponse
    {
        $this->cmsService->flushPublicCache();

        return response()->json([
            'success' => true,
            'message' => 'Public landing page CMS cache purged successfully.',
        ]);
    }

    /**
     * Get theme overrides & white-label settings.
     */
    public function getTheme(): JsonResponse
    {
        $theme = $this->cmsService->getThemeOverrides();

        return response()->json([
            'success' => true,
            'data' => $theme,
        ]);
    }

    /**
     * Update theme overrides & white-label settings.
     */
    public function updateTheme(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'platform_name' => 'nullable|string|max:100',
            'tagline' => 'nullable|string|max:255',
            'creator_name' => 'nullable|string|max:100',
            'creator_url' => 'nullable|url|max:255',
            'primary_logo_url' => 'nullable|string|max:500',
            'dark_logo_url' => 'nullable|string|max:500',
            'favicon_url' => 'nullable|string|max:500',
            'primary_color_hex' => ['nullable', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'accent_color_hex' => ['nullable', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'custom_css' => [
                'nullable',
                'string',
                'max:50000',
                function ($attribute, $value, $fail) {
                    // Disallow hazardous CSS constructs that could enable exfiltration or XSS
                    $dangerousPatterns = [
                        '/url\s*\(/i',
                        '/@import/i',
                        '/javascript\s*:/i',
                        '/expression\s*\(/i',
                        '/behavior\s*:/i',
                        '/<\/style/i',
                        '/<script/i',
                        '/document\./i',
                    ];
                    foreach ($dangerousPatterns as $pattern) {
                        if (preg_match($pattern, $value)) {
                            $fail("The {$attribute} contains unauthorized directives (e.g. url(), @import, or script expressions).");
                            return;
                        }
                    }
                },
            ],
            'custom_head_scripts' => 'nullable|string|max:50000',
            'announcement_banner' => 'nullable|array',
            'announcement_banner.enabled' => 'nullable|boolean',
            'announcement_banner.text' => 'nullable|string|max:300',
            'announcement_banner.link' => 'nullable|string|max:500',
        ]);

        $theme = $this->cmsService->updateThemeOverrides($validated, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Platform theme and white-labeling updated successfully.',
            'data' => $theme,
        ]);
    }

    /**
     * Get all AI prompt templates grouped by task_type.
     */
    public function getPrompts(): JsonResponse
    {
        $prompts = $this->cmsService->getPromptTemplates();

        return response()->json([
            'success' => true,
            'data' => $prompts,
        ]);
    }

    /**
     * Save a new version of an AI prompt template.
     */
    public function savePrompt(Request $request, string $taskType): JsonResponse
    {
        $validated = $request->validate([
            'prompt_template' => 'required|string|min:10',
            'model_override' => 'nullable|string|max:100',
            'temperature' => 'nullable|numeric|between:0,2',
            'max_tokens' => 'nullable|integer|between:100,8192',
            'change_summary' => 'nullable|string|max:500',
        ]);

        $prompt = $this->cmsService->savePromptTemplate(
            $taskType,
            $validated['prompt_template'],
            $validated,
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "New prompt template version {$prompt->version} created for '{$taskType}'.",
            'data' => $prompt,
        ]);
    }

    /**
     * Rollback to a specific prompt version.
     */
    public function rollbackPrompt(Request $request, string $taskType): JsonResponse
    {
        $validated = $request->validate([
            'target_version' => 'required|integer|min:1',
        ]);

        $prompt = $this->cmsService->rollbackPrompt(
            $taskType,
            $validated['target_version'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "Reverted '{$taskType}' prompt to version {$prompt->version}.",
            'data' => $prompt,
        ]);
    }

    /**
     * Get crawler and novelty tuning settings.
     */
    public function getCrawlerTuning(): JsonResponse
    {
        $tuning = $this->cmsService->getCrawlerTuning();

        return response()->json([
            'success' => true,
            'data' => $tuning,
        ]);
    }

    /**
     * Update crawler and novelty tuning settings.
     */
    public function updateCrawlerTuning(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'simhash_hamming_cutoff' => 'nullable|integer|between:1,16',
            'vector_cosine_cutoff' => 'nullable|numeric|between:0.4,0.99',
            'scrape_interval_minutes' => 'nullable|integer|between:10,1440',
            'freshness_window_hours' => 'nullable|integer|between:12,360',
            'max_articles_per_cluster' => 'nullable|integer|between:2,50',
            'auto_publish_threshold' => 'nullable|numeric|between:0.5,1.0',
            'discovery_enabled' => 'nullable|boolean',
        ]);

        $tuning = $this->cmsService->updateCrawlerTuning($validated, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Crawler and Novelty tuning parameters updated successfully.',
            'data' => $tuning,
        ]);
    }
}

