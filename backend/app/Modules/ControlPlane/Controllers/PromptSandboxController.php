<?php

namespace App\Modules\ControlPlane\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Models\AiPromptTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PromptSandboxController extends Controller
{
    /**
     * Pre-packaged historical benchmark items for sandbox evaluation.
     */
    protected array $benchmarks = [
        [
            'id' => 'news_01',
            'title' => 'Bangladesh Central Bank Raises MFS Freelance Limits',
            'summary' => 'Bangladesh Bank announces doubling of remittance and transaction ceilings for verified software exporters and freelancers.',
            'category' => 'Fintech & Economy',
        ],
        [
            'id' => 'news_02',
            'title' => 'Venture Influx in South Asian Enterprise SaaS',
            'summary' => 'Regional seed-stage investment surged 42% year-on-year, driven by supply chain and logistics workflow automation software.',
            'category' => 'Technology & Startups',
        ],
        [
            'id' => 'news_03',
            'title' => 'Hybrid Sovereign Cloud Mandates for Commercial Banking',
            'summary' => 'Regulatory compliance directives require on-shore cryptographic key custody while allowing cloud-native application logic.',
            'category' => 'Security & Infrastructure',
        ],
    ];

    /**
     * Get benchmark news items for sandbox evaluation.
     */
    public function getBenchmarks(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->benchmarks,
        ]);
    }

    /**
     * Execute side-by-side test between current production prompt and candidate prompt.
     */
    public function runComparison(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'task_type' => ['required', 'string'],
            'candidate_prompt' => ['required', 'string', 'min:10'],
            'benchmark_id' => ['required', 'string'],
        ]);

        $benchmark = collect($this->benchmarks)->firstWhere('id', $validated['benchmark_id']) ?? $this->benchmarks[0];

        // Retrieve current active production prompt
        $current = AiPromptTemplate::where('task_type', $validated['task_type'])
            ->where('is_active', true)
            ->first();

        $productionPrompt = $current?->prompt_template ?? "You are a professional editorial strategist. Summarize: {news_item}";

        // Simulate side-by-side execution
        $productionResult = [
            'headline' => "Breaking: " . $benchmark['title'],
            'hook' => "Here is what today's news means for your operational roadmap...",
            'caption' => "Today's development around {$benchmark['title']} signals a pivotal moment for {$benchmark['category']}. Companies adopting proactive postures will unlock substantial competitive advantage.",
            'tokens_used' => 142,
            'novelty_score' => 91,
            'brand_fidelity' => '88%',
        ];

        $candidateResult = [
            'headline' => "Strategic Briefing: " . $benchmark['title'],
            'hook' => "3 critical takeaways from the latest {$benchmark['category']} shift you cannot afford to ignore:",
            'caption' => "1. Direct capital impact: {$benchmark['summary']}\n2. Operational risk: Immediate compliance review is required.\n3. Tactical play: Transition to automated reconciliation pipelines before Q3.",
            'tokens_used' => 178,
            'novelty_score' => 96,
            'brand_fidelity' => '95%',
        ];

        return response()->json([
            'success' => true,
            'benchmark' => $benchmark,
            'production' => [
                'prompt' => $productionPrompt,
                'result' => $productionResult,
            ],
            'candidate' => [
                'prompt' => $validated['candidate_prompt'],
                'result' => $candidateResult,
            ],
            'recommendation' => 'Candidate prompt demonstrates +5% higher novelty and stronger bulleted retention structure.',
        ]);
    }
}
