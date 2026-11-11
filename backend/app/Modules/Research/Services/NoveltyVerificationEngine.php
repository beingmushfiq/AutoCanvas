<?php

namespace App\Modules\Research\Services;

use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\Research\Models\ContentFingerprint;

class NoveltyVerificationEngine
{
    /**
     * Available visual creative template archetypes.
     */
    protected array $templateArchetypes = [
        'minimal_corporate_v1',
        'breaking_news_card',
        'data_stat_callout',
        'quote_thought_leadership',
        'split_comparison',
        'multi_slide_carousel',
    ];

    /**
     * Compute 64-bit SimHash of text.
     */
    public function calculateSimHash64(string $text): int
    {
        $normalized = strtolower(trim(preg_replace('/[^\w\s]/', '', $text)));
        $words = preg_split('/\s+/', $normalized, -1, PREG_SPLIT_NO_EMPTY);
        if (empty($words)) {
            return 0;
        }

        // Generate 3-grams or word tokens
        $tokens = [];
        $count = count($words);
        if ($count < 3) {
            $tokens = $words;
        } else {
            for ($i = 0; $i <= $count - 3; $i++) {
                $tokens[] = $words[$i] . ' ' . $words[$i + 1] . ' ' . $words[$i + 2];
            }
        }

        $v = array_fill(0, 64, 0);

        foreach ($tokens as $token) {
            // Compute 64-bit hash using sha256 truncated
            $hex = hash('sha256', $token);
            $high = hexdec(substr($hex, 0, 8));
            $low = hexdec(substr($hex, 8, 8));

            for ($i = 0; $i < 32; $i++) {
                $bit = ($high >> $i) & 1;
                $v[$i] += ($bit === 1) ? 1 : -1;
            }
            for ($i = 0; $i < 32; $i++) {
                $bit = ($low >> $i) & 1;
                $v[32 + $i] += ($bit === 1) ? 1 : -1;
            }
        }

        $fingerprint = 0;
        for ($i = 0; $i < 64; $i++) {
            if ($v[$i] > 0) {
                // Set the i-th bit
                if ($i < 63) {
                    $fingerprint |= (1 << $i);
                }
            }
        }

        return $fingerprint;
    }

    /**
     * Calculate Hamming distance between two 64-bit integers.
     */
    public function hammingDistance(int $hash1, int $hash2): int
    {
        $xor = $hash1 ^ $hash2;
        $distance = 0;

        // Count set bits
        while ($xor !== 0) {
            $distance += ($xor & 1);
            // Logical right shift in 64-bit PHP
            $xor = ($xor >> 1) & 0x7FFFFFFFFFFFFFFF;
        }

        return $distance;
    }

    /**
     * Calculate Cosine similarity between two float vectors.
     */
    public function cosineSimilarity(array $vecA, array $vecB): float
    {
        $count = min(count($vecA), count($vecB));
        if ($count === 0) {
            return 0.0;
        }

        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        for ($i = 0; $i < $count; $i++) {
            $a = (float) $vecA[$i];
            $b = (float) $vecB[$i];
            $dotProduct += $a * $b;
            $normA += $a * $a;
            $normB += $b * $b;
        }

        if ($normA <= 0.0 || $normB <= 0.0) {
            return 0.0;
        }

        return $dotProduct / (sqrt($normA) * sqrt($normB));
    }

    /**
     * Maximum allowed angle mutations before escalating to human review.
     */
    public const MAX_REFRAME_ATTEMPTS = 3;

    /**
     * Evaluate a candidate post against the brand's temporal memory across 3 layers:
     * 1. Lexical SimHash (Hamming <= 4)
     * 2. Dense Vector Cosine Similarity (>= 0.72) within 180-day archive
     * 3. Template Layout Fatigue (Cooldown on consecutive uses)
     * 
     * Supports strict circuit-breaking (max 3 attempts) and negative prompt accumulation.
     */
    public function evaluateNovelty(
        Brand $brand,
        string $channel,
        string $hook,
        string $concept,
        string $templateId,
        ?array $conceptVector = null,
        array $accumulatedRejections = [],
        int $attempt = 1
    ): array {
        // Enforce strict circuit breaker ceiling
        if ($attempt > self::MAX_REFRAME_ATTEMPTS || count($accumulatedRejections) >= self::MAX_REFRAME_ATTEMPTS) {
            return [
                'is_novel' => false,
                'rejection_reason' => 'max_reframe_attempts_exceeded',
                'escalate_to_human' => true,
                'status' => 'needs_human_angle',
                'attempt' => $attempt,
                'min_hamming_distance' => 0,
                'max_cosine_similarity' => 1.0,
                'candidate_simhash' => $this->calculateSimHash64($hook . ' ' . $concept),
                'mutated_angle' => null,
                'recommended_template' => $templateId,
                'accumulated_rejections' => $accumulatedRejections,
                'negative_prompt' => $this->buildNegativePrompt($accumulatedRejections),
            ];
        }

        $candidateSimHash = $this->calculateSimHash64($hook . ' ' . $concept);

        // Fetch fingerprints for this brand and channel within 180-day window
        $pastFingerprints = ContentFingerprint::where('brand_id', $brand->id)
            ->where('channel', $channel)
            ->where('published_or_scheduled_at', '>=', now()->subDays(180))
            ->latest('published_or_scheduled_at')
            ->take(120)
            ->get();

        $minHamming = 64;
        $maxCosine = 0.0;

        // 1. SimHash Lexical Check (Tier 1)
        foreach ($pastFingerprints as $past) {
            $dist = $this->hammingDistance($candidateSimHash, (int) $past->simhash_64);
            if ($dist < $minHamming) {
                $minHamming = $dist;
            }

            if ($dist <= 4) {
                $newRejections = array_values(array_unique(array_merge($accumulatedRejections, [$hook])));
                return [
                    'is_novel' => false,
                    'rejection_reason' => 'lexical_duplicate_simhash',
                    'escalate_to_human' => false,
                    'status' => 'retry_mutation',
                    'attempt' => $attempt,
                    'min_hamming_distance' => $dist,
                    'max_cosine_similarity' => 1.0,
                    'candidate_simhash' => $candidateSimHash,
                    'mutated_angle' => $this->mutateAngleWithExclusions($concept, $newRejections),
                    'recommended_template' => $this->rotateTemplate($templateId, $pastFingerprints->pluck('creative_template_id')->toArray()),
                    'accumulated_rejections' => $newRejections,
                    'negative_prompt' => $this->buildNegativePrompt($newRejections),
                ];
            }
        }

        // 2. Vector Cosine Semantic Check (Tier 2 - 180 Days)
        if (!empty($conceptVector)) {
            foreach ($pastFingerprints as $past) {
                if (!empty($past->embedding_vector)) {
                    $cos = $this->cosineSimilarity($conceptVector, $past->embedding_vector);
                    if ($cos > $maxCosine) {
                        $maxCosine = $cos;
                    }

                    if ($cos >= 0.72) {
                        $newRejections = array_values(array_unique(array_merge($accumulatedRejections, [$hook])));
                        return [
                            'is_novel' => false,
                            'rejection_reason' => 'conceptual_duplicate_vector',
                            'escalate_to_human' => false,
                            'status' => 'retry_mutation',
                            'attempt' => $attempt,
                            'min_hamming_distance' => $minHamming,
                            'max_cosine_similarity' => round($cos, 4),
                            'candidate_simhash' => $candidateSimHash,
                            'mutated_angle' => $this->mutateAngleWithExclusions($concept, $newRejections),
                            'recommended_template' => $this->rotateTemplate($templateId, $pastFingerprints->pluck('creative_template_id')->toArray()),
                            'accumulated_rejections' => $newRejections,
                            'negative_prompt' => $this->buildNegativePrompt($newRejections),
                        ];
                    }
                }
            }
        }

        // 3. Template Layout Fatigue Check
        $recentTemplates = $pastFingerprints->take(2)->pluck('creative_template_id')->toArray();
        if (in_array($templateId, $recentTemplates, true)) {
            $rotated = $this->rotateTemplate($templateId, $recentTemplates);
            return [
                'is_novel' => false,
                'rejection_reason' => 'template_fatigue',
                'escalate_to_human' => false,
                'status' => 'rotate_template_only',
                'attempt' => $attempt,
                'min_hamming_distance' => $minHamming,
                'max_cosine_similarity' => round($maxCosine, 4),
                'candidate_simhash' => $candidateSimHash,
                'mutated_angle' => null,
                'recommended_template' => $rotated,
                'accumulated_rejections' => $accumulatedRejections,
                'negative_prompt' => $this->buildNegativePrompt($accumulatedRejections),
            ];
        }

        return [
            'is_novel' => true,
            'rejection_reason' => null,
            'escalate_to_human' => false,
            'status' => 'approved',
            'attempt' => $attempt,
            'min_hamming_distance' => $minHamming,
            'max_cosine_similarity' => round($maxCosine, 4),
            'candidate_simhash' => $candidateSimHash,
            'mutated_angle' => null,
            'recommended_template' => $templateId,
            'accumulated_rejections' => $accumulatedRejections,
            'negative_prompt' => '',
        ];
    }

    /**
     * Build negative prompt injection string for LLM refinement.
     */
    public function buildNegativePrompt(array $rejections): string
    {
        if (empty($rejections)) {
            return '';
        }

        $lines = [];
        foreach ($rejections as $idx => $rej) {
            $num = $idx + 1;
            $lines[] = "  {$num}. \"{$rej}\"";
        }

        return "CRITICAL NEGATIVE PROMPT CONSTRAINT:\nYou have already tested the following angles/hooks which collided with past 180-day posts:\n" 
            . implode("\n", $lines) 
            . "\nYou MUST adopt a completely orthogonal perspective. Do NOT reuse these hooks.";
    }

    /**
     * Mutate an angle while explicitly excluding already rejected angles.
     */
    public function mutateAngleWithExclusions(string $originalConcept, array $rejections = []): string
    {
        $mutations = [
            "Contrarian Inversion: Why the popular industry consensus regarding '{$originalConcept}' overlooks critical hidden failure modes.",
            "Tactical Playbook: 5 non-obvious operational implementation steps to capitalize on '{$originalConcept}'.",
            "Second-Order Macro Impact: Analyzing what '{$originalConcept}' means for market dynamics 24 months from now.",
            "Case Study & Data Analysis: Examining real-world benchmark metrics and ROI surrounding '{$originalConcept}'.",
            "Executive Risk Assessment: The hidden regulatory, compliance, and governance vulnerabilities of '{$originalConcept}'.",
        ];

        // Filter out mutations that might be in rejections
        $available = array_filter($mutations, function ($m) use ($rejections) {
            foreach ($rejections as $r) {
                if (stripos($m, $r) !== false || stripos($r, $m) !== false) {
                    return false;
                }
            }
            return true;
        });

        if (empty($available)) {
            $available = $mutations;
        }

        return $available[array_rand($available)];
    }

    /**
     * Mutate an angle when duplication is detected.
     */
    public function mutateAngle(string $originalConcept, string $cause): string
    {
        $mutations = [
            "Contrarian Inversion: Why the popular industry consensus regarding '{$originalConcept}' overlooks critical hidden failure modes.",
            "Tactical Playbook: 5 non-obvious operational implementation steps to capitalize on '{$originalConcept}'.",
            "Second-Order Macro Impact: Analyzing what '{$originalConcept}' means for market dynamics 24 months from now.",
            "Case Study & Data Analysis: Examining real-world benchmark metrics and ROI surrounding '{$originalConcept}'.",
        ];

        return $mutations[array_rand($mutations)];
    }

    /**
     * Deterministically rotate creative template to avoid repetition.
     */
    public function rotateTemplate(string $currentTemplate, array $recentTemplates = []): string
    {
        $available = array_diff($this->templateArchetypes, array_merge([$currentTemplate], $recentTemplates));
        if (empty($available)) {
            $available = array_diff($this->templateArchetypes, [$currentTemplate]);
        }

        return !empty($available) ? $available[array_rand($available)] : 'data_stat_callout';
    }

    /**
     * Persist verified fingerprint into the database registry.
     */
    public function registerFingerprint(
        Brand $brand,
        ContentItem $item,
        string $channel,
        string $hook,
        string $concept,
        string $templateId,
        ?array $vector = null
    ): ContentFingerprint {
        $simhash = $this->calculateSimHash64($hook . ' ' . $concept);

        return ContentFingerprint::create([
            'organization_id' => $brand->organization_id,
            'workspace_id' => $brand->workspace_id,
            'brand_id' => $brand->id,
            'content_item_id' => $item->id,
            'channel' => $channel,
            'simhash_64' => $simhash,
            'concept_summary' => $concept,
            'hook_text' => $hook,
            'embedding_vector' => $vector,
            'creative_template_id' => $templateId,
            'published_or_scheduled_at' => $item->scheduled_for ?? now(),
        ]);
    }
}

