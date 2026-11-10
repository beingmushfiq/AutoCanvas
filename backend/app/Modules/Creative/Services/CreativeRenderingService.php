<?php

namespace App\Modules\Creative\Services;

use App\Modules\Brand\Models\Brand;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CreativeRenderingService
{
    protected string $rendererUrl;

    public function __construct()
    {
        $this->rendererUrl = env('RENDERER_URL', 'http://127.0.0.1:3001');
    }

    /**
     * Get system-supported creative templates.
     */
    public function getTemplates(): array
    {
        return [
            [
                'id' => 'minimal_corporate_v1',
                'name' => 'Minimal Corporate',
                'category' => 'B2B & Enterprise',
                'description' => 'Clean dark background with bold brand-accented headline and footer CTA.',
                'aspect_ratios' => ['1:1', '4:5', '16:9'],
            ],
            [
                'id' => 'bold_editorial_v1',
                'name' => 'Bold Editorial',
                'category' => 'Thought Leadership',
                'description' => 'High-typography statement with dual-color accent highlights.',
                'aspect_ratios' => ['1:1', '4:5'],
            ],
            [
                'id' => 'tech_stats_v1',
                'name' => 'Metric & Stat Highlight',
                'category' => 'Data & Performance',
                'description' => 'Prominent oversized metric callout with supporting context.',
                'aspect_ratios' => ['1:1', '16:9'],
            ],
            [
                'id' => 'announcement_v1',
                'name' => 'Product Announcement',
                'category' => 'Product News',
                'description' => 'Badge tag header with central feature spotlight card.',
                'aspect_ratios' => ['1:1', '4:5', '16:9'],
            ],
        ];
    }

    /**
     * Render creative document to public storage.
     */
    public function render(Brand $brand, array $options): array
    {
        $templateId = $options['template_id'] ?? 'minimal_corporate_v1';
        $width = (int) ($options['width'] ?? 1080);
        $height = (int) ($options['height'] ?? 1080);

        $headline = $options['headline'] ?? $brand->name;
        $supportingText = $options['supporting_text'] ?? null;
        $cta = $options['call_to_action'] ?? ($brand->profile?->primary_cta ?? 'Learn More');

        $doc = [
            'width' => $width,
            'height' => $height,
            'backgroundColor' => $options['background_color'] ?? ($brand->visualIdentity?->primary_color ?? '#101828'),
            'brand' => [
                'name' => $brand->name,
                'logoUrl' => $brand->visualIdentity?->primary_logo_url,
                'primaryColor' => $brand->visualIdentity?->secondary_color ?? '#6257E8',
                'secondaryColor' => $brand->visualIdentity?->accent_colors[0] ?? '#24A0A8',
            ],
            'content' => [
                'headline' => $headline,
                'supportingText' => $supportingText,
                'callToAction' => $cta,
            ],
            'templateId' => $templateId,
        ];

        $filename = 'creative_'.Str::ulid();
        $relativeDir = "brands/{$brand->id}/creatives";

        try {
            // Attempt HTTP call to Node.js / Playwright rendering daemon
            $response = Http::timeout(6)->post("{$this->rendererUrl}/render", $doc);

            if ($response->successful()) {
                $imagePath = "{$relativeDir}/{$filename}.png";
                Storage::disk('public')->put($imagePath, $response->body());

                return [
                    'success' => true,
                    'file_path' => $imagePath,
                    'file_url' => Storage::disk('public')->url($imagePath),
                    'format' => 'png',
                    'width' => $width,
                    'height' => $height,
                    'renderer' => 'playwright_chromium',
                    'creative_document' => $doc,
                ];
            }
        } catch (\Exception $e) {
            Log::warning("[CreativeRenderingService] Renderer daemon offline at {$this->rendererUrl}, generating SVG fallback: ".$e->getMessage());
        }

        // Graceful deterministic SVG fallback
        $svgContent = $this->composeFallbackSvg($doc);
        $svgPath = "{$relativeDir}/{$filename}.svg";
        Storage::disk('public')->put($svgPath, $svgContent);

        return [
            'success' => true,
            'file_path' => $svgPath,
            'file_url' => Storage::disk('public')->url($svgPath),
            'format' => 'svg',
            'width' => $width,
            'height' => $height,
            'renderer' => 'deterministic_svg_fallback',
            'creative_document' => $doc,
        ];
    }

    /**
     * Generate valid, standalone SVG creative fallback.
     */
    protected function composeFallbackSvg(array $doc): string
    {
        $w = $doc['width'];
        $h = $doc['height'];
        $bg = htmlspecialchars($doc['backgroundColor']);
        $primary = htmlspecialchars($doc['brand']['primaryColor']);
        $name = htmlspecialchars($doc['brand']['name']);
        $headline = htmlspecialchars($doc['content']['headline']);
        $supporting = htmlspecialchars($doc['content']['supportingText'] ?? '');
        $cta = htmlspecialchars($doc['content']['callToAction'] ?? '');

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {$w} {$h}" width="{$w}" height="{$h}">
  <rect width="{$w}" height="{$h}" fill="{$bg}"/>
  <circle cx="{$w}" cy="0" r="300" fill="{$primary}" opacity="0.15"/>
  <rect x="80" y="80" width="48" height="48" rx="12" fill="{$primary}"/>
  <text x="104" y="112" fill="#ffffff" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">A</text>
  <text x="144" y="112" fill="#ffffff" font-family="system-ui, sans-serif" font-size="24" font-weight="600">{$name}</text>
  <text x="80" y="320" fill="#ffffff" font-family="system-ui, sans-serif" font-size="52" font-weight="800" width="900">
    {$headline}
  </text>
  <text x="80" y="420" fill="#98A2B3" font-family="system-ui, sans-serif" font-size="26" font-weight="400">
    {$supporting}
  </text>
  <rect x="80" y="880" width="280" height="60" rx="30" fill="{$primary}"/>
  <text x="220" y="918" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">{$cta}</text>
</svg>
SVG;
    }
}
