<?php

namespace App\AI\Services;

class AiCostCalculator
{
    /**
     * Pricing table per 1,000,000 tokens (USD).
     *
     * @var array<string, array{input: float, output: float}>
     */
    protected static array $rates = [
        'gemini-1.5-flash' => [
            'input' => 0.075,
            'output' => 0.30,
        ],
        'gemini-1.5-pro' => [
            'input' => 1.25,
            'output' => 5.00,
        ],
        'claude-3-5-sonnet' => [
            'input' => 3.00,
            'output' => 15.00,
        ],
        'claude-3-5-sonnet-20241022' => [
            'input' => 3.00,
            'output' => 15.00,
        ],
        'gpt-4o-mini' => [
            'input' => 0.15,
            'output' => 0.60,
        ],
        'gpt-4o' => [
            'input' => 2.50,
            'output' => 10.00,
        ],
        'mock' => [
            'input' => 0.00,
            'output' => 0.00,
        ],
    ];

    /**
     * Calculate estimated cost in USD based on model and token counts.
     */
    public static function calculate(string $model, int $inputTokens, int $outputTokens): float
    {
        $normalizedModel = strtolower(trim($model));

        $rate = self::$rates[$normalizedModel] ?? null;

        if (! $rate) {
            // Partial match fallback
            foreach (self::$rates as $key => $r) {
                if (str_contains($normalizedModel, $key)) {
                    $rate = $r;
                    break;
                }
            }
        }

        // Standard default rate if completely unknown
        $rate = $rate ?? ['input' => 0.50, 'output' => 1.50];

        $inputCost = ($inputTokens / 1_000_000) * $rate['input'];
        $outputCost = ($outputTokens / 1_000_000) * $rate['output'];

        return round($inputCost + $outputCost, 6);
    }
}

