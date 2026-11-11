<?php

namespace App\Modules\ContentProduction\Services;

class BilingualTypographyService
{
    /**
     * Detect if text contains Bengali Unicode characters.
     */
    public function isBengali(string $text): bool
    {
        return (bool) preg_match('/[\x{0980}-\x{09FF}]/u', $text);
    }

    /**
     * Get typographic styling metrics suited for the language script.
     */
    public function getTypographicMetrics(string $text): array
    {
        $hasBengali = $this->isBengali($text);

        if ($hasBengali) {
            return [
                'language' => 'bn',
                'script' => 'bengali',
                'font_family' => "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
                'line_height' => 1.65, // Matras and conjuncts require generous vertical metrics
                'letter_spacing' => '0em',
                'optimal_headline_size' => '48px',
                'harfbuzz_shaping_required' => true,
            ];
        }

        return [
            'language' => 'en',
            'script' => 'latin',
            'font_family' => "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            'line_height' => 1.35,
            'letter_spacing' => '-0.02em',
            'optimal_headline_size' => '52px',
            'harfbuzz_shaping_required' => false,
        ];
    }
}

