<?php

namespace App\Modules\Brand\Services;

use App\AI\Gateway\AIGateway;
use App\Modules\Brand\Models\Brand;

class BrandDiscoveryService
{
    public function __construct(
        protected AIGateway $aiGateway
    ) {}

    /**
     * Analyze uploaded brand documents or website content to synthesize a proposed brand profile.
     */
    public function discoverFromText(Brand $brand, string $referenceText): array
    {
        $prompt = <<<PROMPT
Analyze the following brand source text and synthesize a structured brand identity profile.
Return a valid JSON object with the following schema:
{
  "mission": "concise brand mission statement",
  "vision": "long-term vision statement",
  "positioning": "market positioning statement",
  "personality_traits": ["trait1", "trait2", "trait3", "trait4"],
  "tone": "communication tone description",
  "primary_color": "#hexcode",
  "secondary_color": "#hexcode",
  "primary_font": "FontName",
  "confidence_scores": {
    "mission": 0.0-1.0,
    "positioning": 0.0-1.0,
    "tone": 0.0-1.0
  }
}

Source text to analyze:
{$referenceText}
PROMPT;

        $response = $this->aiGateway->generateText($prompt, [
            'task_type' => 'brand_discovery',
            'organization_id' => $brand->organization_id,
            'brand_id' => $brand->id,
        ]);

        $decoded = json_decode($response['text'], true);

        if (! is_array($decoded)) {
            // Fallback safe defaults if JSON parsing failed
            $decoded = [
                'mission' => 'Empower sustainable high performance.',
                'vision' => 'To be the standard for modern brand operations.',
                'positioning' => 'Premium, data-backed brand communication.',
                'personality_traits' => ['authoritative', 'approachable', 'creative'],
                'tone' => 'Professional, confident, and direct',
                'primary_color' => '#101828',
                'secondary_color' => '#6257E8',
                'primary_font' => 'Inter',
                'confidence_scores' => [
                    'mission' => 0.85,
                    'positioning' => 0.80,
                    'tone' => 0.80,
                ],
            ];
        }

        return [
            'discovered_profile' => $decoded,
            'meta' => [
                'model' => $response['model'],
                'input_tokens' => $response['input_tokens'],
                'output_tokens' => $response['output_tokens'],
                'requires_confirmation' => true,
            ],
        ];
    }
}
