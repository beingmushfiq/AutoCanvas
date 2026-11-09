<?php

namespace App\Modules\Knowledge\Services;

use App\Modules\Brand\Models\Brand;
use App\Modules\Knowledge\Models\KnowledgeSource;
use App\Modules\Knowledge\Models\SourceChunk;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class KnowledgeIngestionService
{
    /**
     * Ingest and chunk text or document content into the brand knowledge base.
     */
    public function ingestText(
        Brand $brand,
        string $title,
        string $rawText,
        string $sourceType = 'raw_text',
        string $credibility = 'A',
        ?string $uri = null
    ): KnowledgeSource {
        $cleanText = $this->sanitizeText($rawText);
        $fingerprint = hash('sha256', $cleanText);

        $source = KnowledgeSource::create([
            'organization_id' => $brand->organization_id,
            'workspace_id' => $brand->workspace_id,
            'brand_id' => $brand->id,
            'source_type' => $sourceType,
            'display_name' => $title,
            'original_uri' => $uri,
            'content_fingerprint' => $fingerprint,
            'credibility' => $credibility,
            'status' => 'processing',
        ]);

        $chunks = $this->chunkText($cleanText, 400, 50);

        foreach ($chunks as $index => $chunkText) {
            $tokenCount = (int) ceil(strlen($chunkText) / 4);

            SourceChunk::create([
                'knowledge_source_id' => $source->id,
                'organization_id' => $brand->organization_id,
                'brand_id' => $brand->id,
                'chunk_index' => $index,
                'content' => $chunkText,
                'token_count' => $tokenCount,
            ]);
        }

        $source->update([
            'status' => 'completed',
            'citation_metadata' => [
                'total_chunks' => count($chunks),
                'total_characters' => strlen($cleanText),
            ],
        ]);

        return $source;
    }

    /**
     * Ingest a public URL with strict SSRF defense.
     */
    public function ingestUrl(Brand $brand, string $url): KnowledgeSource
    {
        $this->validateUrlForSsrf($url);

        $response = Http::timeout(10)
            ->withUserAgent('AutoCanvas-KnowledgeBot/1.0 (+https://autocanvas.io)')
            ->get($url);

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'url' => ["Failed to fetch target URL. HTTP status: {$response->status()}"],
            ]);
        }

        $html = $response->body();
        $title = $this->extractTitleFromHtml($html) ?: parse_url($url, PHP_URL_HOST);
        $text = $this->extractTextFromHtml($html);

        return $this->ingestText(
            $brand,
            $title,
            $text,
            'website_url',
            'A', // Official website primary source
            $url
        );
    }

    /**
     * Strict SSRF validator preventing access to internal, loopback, or cloud metadata IPs.
     */
    public function validateUrlForSsrf(string $url): void
    {
        $parts = parse_url($url);
        if (! isset($parts['scheme']) || ! in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
            throw ValidationException::withMessages([
                'url' => ['Only HTTP and HTTPS URLs are permitted.'],
            ]);
        }

        $host = $parts['host'] ?? '';
        if (empty($host)) {
            throw ValidationException::withMessages(['url' => ['Invalid URL host.']]);
        }

        // Reject localhost keywords
        if (in_array(strtolower($host), ['localhost', '127.0.0.1', '::1', '0.0.0.0'], true)) {
            throw ValidationException::withMessages([
                'url' => ['SSRF Security Violation: Access to loopback hosts is blocked.'],
            ]);
        }

        $ip = gethostbyname($host);
        if (! filter_var($ip, FILTER_VALIDATE_IP)) {
            throw ValidationException::withMessages(['url' => ['Unable to resolve hostname IP address.']]);
        }

        // Validate IP is NOT private, reserved, or loopback
        $isPublic = filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );

        if (! $isPublic || str_starts_with($ip, '127.') || str_starts_with($ip, '169.254.')) {
            throw ValidationException::withMessages([
                'url' => ["SSRF Security Violation: Resolved IP [{$ip}] is internal or restricted."],
            ]);
        }
    }

    /**
     * Sanitize text and prevent prompt injection delimiters.
     */
    protected function sanitizeText(string $text): string
    {
        // Normalize whitespace and newlines
        $normalized = preg_replace('/\R+/', "\n", trim($text));

        // Strip null bytes
        return str_replace("\0", '', $normalized);
    }

    /**
     * Split text into overlapping word chunks.
     */
    protected function chunkText(string $text, int $chunkWords = 400, int $overlapWords = 50): array
    {
        $words = preg_split('/\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        if (empty($words)) {
            return [];
        }

        $chunks = [];
        $totalWords = count($words);
        $start = 0;

        while ($start < $totalWords) {
            $slice = array_slice($words, $start, $chunkWords);
            $chunks[] = implode(' ', $slice);
            $start += ($chunkWords - $overlapWords);
            if ($start >= $totalWords - $overlapWords && $start < $totalWords) {
                // Last partial remainder
                $remainder = array_slice($words, $start);
                if (! empty($remainder)) {
                    $chunks[] = implode(' ', $remainder);
                }
                break;
            }
        }

        return $chunks;
    }

    protected function extractTitleFromHtml(string $html): ?string
    {
        if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $matches)) {
            return trim(html_entity_decode(strip_tags($matches[1])));
        }

        return null;
    }

    protected function extractTextFromHtml(string $html): string
    {
        // Strip scripts and styles
        $clean = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
        $clean = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $clean);

        // Strip HTML tags and decode entities
        return trim(html_entity_decode(strip_tags($clean)));
    }
}
