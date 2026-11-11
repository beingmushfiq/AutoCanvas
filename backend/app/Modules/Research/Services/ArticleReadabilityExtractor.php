<?php

namespace App\Modules\Research\Services;

class ArticleReadabilityExtractor
{
    /**
     * Extract clean article body and metadata from HTML content.
     */
    public function extractFromHtml(string $html, ?string $fallbackUrl = null): array
    {
        // 1. Strip scripts, styles, iframes, nav, footer, ads
        $cleaned = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
        $cleaned = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $cleaned);
        $cleaned = preg_replace('/<iframe\b[^>]*>(.*?)<\/iframe>/is', '', $cleaned);
        $cleaned = preg_replace('/<nav\b[^>]*>(.*?)<\/nav>/is', '', $cleaned);
        $cleaned = preg_replace('/<footer\b[^>]*>(.*?)<\/footer>/is', '', $cleaned);
        $cleaned = preg_replace('/<header\b[^>]*>(.*?)<\/header>/is', '', $cleaned);

        // 2. Extract Title
        $title = '';
        if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $matches)) {
            $title = trim(strip_tags($matches[1]));
        }

        // 3. Extract Main Article Body
        $paragraphs = [];
        if (preg_match_all('/<p[^>]*>(.*?)<\/p>/is', $cleaned, $matches)) {
            foreach ($matches[1] as $p) {
                $plain = trim(strip_tags($p));
                // Filter out short footer text, copyright, or cookie disclaimers
                if (strlen($plain) > 40 && !preg_match('/(cookie|copyright|all rights reserved|subscribe)/i', $plain)) {
                    $paragraphs[] = $plain;
                }
            }
        }

        $bodyText = implode("\n\n", $paragraphs);
        $domain = $fallbackUrl ? parse_url($fallbackUrl, PHP_URL_HOST) : 'source';

        // 4. Extract Key Entities (Capitalized Multi-word phrases or capitalized tokens)
        $entities = $this->extractKeyEntities($bodyText);

        return [
            'title' => $title ?: 'Industry Article',
            'domain' => $domain ?: 'unknown',
            'body' => $bodyText,
            'word_count' => str_word_count($bodyText),
            'summary' => substr($bodyText, 0, 300) . (strlen($bodyText) > 300 ? '...' : ''),
            'entities' => $entities,
        ];
    }

    /**
     * Heuristic entity extraction for companies, people, technologies, and products.
     */
    protected function extractKeyEntities(string $text): array
    {
        preg_match_all('/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/', $text, $matches);
        $counts = array_count_values($matches[0] ?? []);
        arsort($counts);

        // Return top 8 most frequent capitalized phrases
        return array_slice(array_keys($counts), 0, 8);
    }
}

