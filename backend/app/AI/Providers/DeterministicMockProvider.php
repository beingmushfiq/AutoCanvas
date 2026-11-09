<?php

namespace App\AI\Providers;

use App\AI\Contracts\AIProviderInterface;

class DeterministicMockProvider implements AIProviderInterface
{
    public function getName(): string
    {
        return 'mock';
    }

    public function generateText(string $prompt, array $options = []): array
    {
        $task = $options['task_type'] ?? 'general';

        if ($task === 'brand_discovery') {
            $response = json_encode([
                'mission' => 'Empower sustainable high performance with precision engineering.',
                'vision' => 'To become the global standard for modern, responsible athletic gear.',
                'positioning' => 'Premium, science-backed athletic lifestyle for disciplined professionals.',
                'personality_traits' => ['authoritative', 'inspiring', 'technical', 'disciplined'],
                'tone' => 'Direct, motivational, evidence-based, clean',
                'primary_color' => '#0F172A',
                'secondary_color' => '#E11D48',
                'primary_font' => 'Inter',
                'confidence_scores' => [
                    'mission' => 0.95,
                    'positioning' => 0.92,
                    'tone' => 0.88,
                ],
            ]);
        } else {
            $response = 'Generated synthesized content based on input prompt.';
        }

        $inputTokens = (int) ceil(strlen($prompt) / 4);
        $outputTokens = (int) ceil(strlen($response) / 4);

        return [
            'text' => $response,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'model' => 'deterministic-mock-v1',
        ];
    }

    public function generateEmbedding(string $text): array
    {
        // Produce a deterministic 8-dimensional normalized pseudo-vector
        $hash = md5($text);
        $vector = [];
        for ($i = 0; $i < 8; $i++) {
            $hex = substr($hash, $i * 4, 4);
            $vector[] = round((hexdec($hex) / 65535) * 2 - 1, 4);
        }

        return [
            'embedding' => $vector,
            'tokens' => (int) ceil(strlen($text) / 4),
            'model' => 'mock-embedding-v1',
        ];
    }
}
