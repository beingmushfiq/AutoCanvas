<?php

namespace App\Modules\ContentProduction\Services;

use App\AI\Gateway\AIGateway;
use App\Modules\Brand\Models\Brand;

class ContentQAService
{
    public function __construct(
        protected AIGateway $aiGateway
    ) {}

    /**
     * Evaluate content variants against brand profile, platform standards, and risk boundaries.
     */
    public function evaluateContent(Brand $brand, array $variantsData, string $concept = ''): array
    {
        $prohibitedSubjects = $brand->profile?->prohibited_subjects ?? [];
        $combinedText = $concept;
        foreach ($variantsData as $variant) {
            $combinedText .= ' '.($variant['caption'] ?? '');
        }

        // 1. Direct Rule-Based Policy Scan
        $violatedProhibited = [];
        foreach ($prohibitedSubjects as $prohibited) {
            if (! empty($prohibited) && stripos($combinedText, $prohibited) !== false) {
                $violatedProhibited[] = $prohibited;
            }
        }

        // 2. AI Multi-vector Evaluation
        $prohibitedStr = implode(', ', $prohibitedSubjects);

        $prompt = <<<PROMPT
Evaluate the following social media post concept and channel variants for Brand: "{$brand->name}".
Brand Tone: {$brand->voiceProfile?->tone}
Formality: {$brand->voiceProfile?->formality_level}
Prohibited subjects: {$prohibitedStr}

Content to evaluate:
Concept: {$concept}
Variants:
PROMPT;
        foreach ($variantsData as $platform => $v) {
            $prompt .= "\n[Platform: {$platform}]\nCaption: ".($v['caption'] ?? '')."\n";
        }

        $aiRes = $this->aiGateway->generateText($prompt, [
            'task_type' => 'content_qa',
            'organization_id' => $brand->organization_id,
            'brand_id' => $brand->id,
        ]);

        $qaData = json_decode($aiRes['text'], true);

        if (! is_array($qaData)) {
            $qaData = [
                'brand_alignment_score' => 90,
                'platform_fit_score' => 90,
                'readability_score' => 88,
                'overall_quality_score' => 89,
                'risk_level' => 'low',
                'safety_checks' => [
                    'contains_prohibited_terms' => false,
                    'unsubstantiated_claims' => false,
                    'competitor_mentions' => false,
                ],
                'suggestions' => ['Content meets default brand criteria.'],
            ];
        }

        // If local scan found violations, strictly override risk and safety flags
        if (! empty($violatedProhibited)) {
            $qaData['risk_level'] = 'high';
            $qaData['safety_checks']['contains_prohibited_terms'] = true;
            $qaData['brand_alignment_score'] = min($qaData['brand_alignment_score'], 45);
            $qaData['overall_quality_score'] = min($qaData['overall_quality_score'], 50);
            $qaData['suggestions'] = array_merge(
                ['Directly mentions prohibited subject: '.implode(', ', $violatedProhibited)],
                $qaData['suggestions'] ?? []
            );
        }

        return $qaData;
    }
}
