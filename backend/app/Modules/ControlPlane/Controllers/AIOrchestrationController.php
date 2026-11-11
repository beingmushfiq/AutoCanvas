<?php

namespace App\Modules\ControlPlane\Controllers;

use App\AI\Models\AiUsageRecord;
use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Services\SystemSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AIOrchestrationController extends Controller
{
    public function __construct(
        protected SystemSettingsService $settingsService
    ) {}

    /**
     * Get AI provider status, model options, and active task routing.
     */
    public function providers(): JsonResponse
    {
        $hasGoogleKey = ! empty(env('GOOGLE_AI_API_KEY')) || ! empty(config('services.google.ai_key'));
        $hasAnthropicKey = ! empty(env('ANTHROPIC_API_KEY')) || ! empty(config('services.anthropic.api_key'));
        $hasOpenAiKey = ! empty(env('OPENAI_API_KEY')) || ! empty(config('services.openai.api_key'));

        $providers = [
            [
                'id' => 'gemini',
                'name' => 'Google Gemini',
                'is_configured' => $hasGoogleKey,
                'default_model' => 'gemini-1.5-flash',
                'supported_models' => ['gemini-1.5-flash', 'gemini-1.5-pro'],
                'embedding_model' => 'text-embedding-004',
            ],
            [
                'id' => 'anthropic',
                'name' => 'Anthropic Claude',
                'is_configured' => $hasAnthropicKey,
                'default_model' => 'claude-3-5-sonnet-20241022',
                'supported_models' => ['claude-3-5-sonnet-20241022'],
                'embedding_model' => null,
            ],
            [
                'id' => 'openai',
                'name' => 'OpenAI',
                'is_configured' => $hasOpenAiKey,
                'default_model' => 'gpt-4o-mini',
                'supported_models' => ['gpt-4o-mini', 'gpt-4o'],
                'embedding_model' => 'text-embedding-3-small',
            ],
            [
                'id' => 'mock',
                'name' => 'Deterministic Mock Engine',
                'is_configured' => true,
                'default_model' => 'mock-v1',
                'supported_models' => ['mock-v1'],
                'embedding_model' => 'pseudo-vector-8d',
            ],
        ];

        $defaultProvider = (string) $this->settingsService->get('default_ai_provider', 'gemini');
        $taskRouting = (array) $this->settingsService->get('ai_task_routing', [
            'research_summarization' => 'gemini',
            'brand_discovery' => 'gemini',
            'creative_copywriting' => 'anthropic',
            'qa_risk_evaluation' => 'openai',
            'reply_suggester' => 'gemini',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'providers' => $providers,
                'default_provider' => $defaultProvider,
                'task_routing' => $taskRouting,
            ],
        ]);
    }

    /**
     * Update active AI provider defaults and task-based routing rules.
     */
    public function updateRouting(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'default_provider' => ['nullable', 'string', 'in:gemini,anthropic,openai,mock'],
            'task_routing' => ['nullable', 'array'],
        ]);

        $admin = $request->user();

        if (! empty($validated['default_provider'])) {
            $this->settingsService->set('default_ai_provider', $validated['default_provider'], $admin, 'ai');
        }

        if (isset($validated['task_routing'])) {
            $this->settingsService->set('ai_task_routing', $validated['task_routing'], $admin, 'ai');
        }

        return response()->json([
            'success' => true,
            'message' => 'AI routing configuration updated successfully.',
            'data' => [
                'default_provider' => $this->settingsService->get('default_ai_provider'),
                'task_routing' => $this->settingsService->get('ai_task_routing'),
            ],
        ]);
    }

    /**
     * Get aggregated token usage and cost analytics across providers and models.
     */
    public function usage(Request $request): JsonResponse
    {
        $days = (int) $request->get('days', 30);
        $since = now()->subDays($days);

        $summary = AiUsageRecord::where('created_at', '>=', $since)
            ->select(
                'provider',
                'model',
                'task_type',
                DB::raw('COUNT(*) as total_requests'),
                DB::raw('SUM(input_tokens) as total_input_tokens'),
                DB::raw('SUM(output_tokens) as total_output_tokens'),
                DB::raw('SUM(estimated_cost_usd) as total_cost_usd')
            )
            ->groupBy('provider', 'model', 'task_type')
            ->get();

        $grossCost = round((float) AiUsageRecord::where('created_at', '>=', $since)->sum('estimated_cost_usd'), 4);
        $totalInputTokens = (int) AiUsageRecord::where('created_at', '>=', $since)->sum('input_tokens');
        $totalOutputTokens = (int) AiUsageRecord::where('created_at', '>=', $since)->sum('output_tokens');

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'totals' => [
                    'days' => $days,
                    'gross_cost_usd' => $grossCost,
                    'total_input_tokens' => $totalInputTokens,
                    'total_output_tokens' => $totalOutputTokens,
                ],
            ],
        ]);
    }
}

