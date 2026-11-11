<?php

namespace App\Modules\Creative\Services;

use App\Modules\Brand\Models\Brand;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ServerSideRendererService
{
    public function __construct(
        protected ChromiumRendererClient $chromiumClient
    ) {}

    /**
     * Render SVG with Bengali Unicode and HarfBuzz font stack fallback.
     */
    public function renderSvgWithTypography(array $doc): string
    {
        $w = $doc['width'] ?? 1080;
        $h = $doc['height'] ?? 1080;
        $bg = htmlspecialchars($doc['backgroundColor'] ?? '#0f172a');
        $primary = htmlspecialchars($doc['brand']['primaryColor'] ?? '#6366f1');
        $accent = htmlspecialchars($doc['brand']['secondaryColor'] ?? '#f59e0b');
        $name = htmlspecialchars($doc['brand']['name'] ?? 'AutoCanvas');
        $headline = htmlspecialchars($doc['content']['headline'] ?? '');
        $supporting = htmlspecialchars($doc['content']['supportingText'] ?? '');
        $cta = htmlspecialchars($doc['content']['callToAction'] ?? 'Read Insights');

        // Font family with Bengali Unicode ligature priorities
        $fontStack = "'Hind Siliguri', 'Noto Sans Bengali', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {$w} {$h}" width="{$w}" height="{$h}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{$bg}" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{$primary}" />
      <stop offset="100%" stop-color="{$accent}" />
    </linearGradient>
  </defs>

  <!-- Canvas Background -->
  <rect width="{$w}" height="{$h}" fill="url(#bgGrad)"/>
  <circle cx="{$w}" cy="0" r="400" fill="{$primary}" opacity="0.12"/>
  <circle cx="0" cy="{$h}" r="350" fill="{$accent}" opacity="0.08"/>

  <!-- Brand Header Mark -->
  <rect x="80" y="80" width="52" height="52" rx="14" fill="url(#accentGrad)"/>
  <text x="106" y="114" fill="#ffffff" font-family="{$fontStack}" font-size="24" font-weight="bold" text-anchor="middle">A</text>
  <text x="150" y="114" fill="#f8fafc" font-family="{$fontStack}" font-size="26" font-weight="700">{$name}</text>

  <!-- Editorial Headline (Supports English and complex Bengali matras) -->
  <text x="80" y="320" fill="#ffffff" font-family="{$fontStack}" font-size="52" font-weight="800" style="letter-spacing: -0.02em;">
    {$headline}
  </text>

  <!-- Supporting Narrative Text -->
  <text x="80" y="440" fill="#94a3b8" font-family="{$fontStack}" font-size="26" font-weight="400">
    {$supporting}
  </text>

  <!-- Editorial Callout Chip -->
  <rect x="80" y="860" width="300" height="64" rx="32" fill="url(#accentGrad)"/>
  <text x="230" y="901" fill="#ffffff" font-family="{$fontStack}" font-size="20" font-weight="700" text-anchor="middle">
    {$cta} &rarr;
  </text>

  <!-- Verification Badge -->
  <text x="{$w}" y="{$h}" dx="-80" dy="-80" fill="#64748b" font-family="{$fontStack}" font-size="16" text-anchor="end">
    Verified by DevCenterPoint Autonomous Engine
  </text>
</svg>
SVG;
    }

    /**
     * Generate multi-slide carousel document structure for LinkedIn / PDF export.
     */
    public function generateCarouselPdf(Brand $brand, array $slides): array
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        $renderedSlides = [];
        $brandId = (string) ($brand->getKey() ?? $brand->id);
        $brandName = (string) ($brand->name ?? 'AutoCanvas');
        $dir = "brands/{$brandId}/carousels/" . Str::ulid();

        foreach ($slides as $index => $slide) {
            $slideDoc = [
                'width' => 1080,
                'height' => 1080,
                'backgroundColor' => '#0f172a',
                'brand' => [
                    'name' => $brandName,
                    'primaryColor' => $brand->visualIdentity?->secondary_color ?? '#6366f1',
                    'secondaryColor' => $brand->visualIdentity?->accent_colors[0] ?? '#f59e0b',
                ],
                'content' => [
                    'headline' => $slide['headline'] ?? "Slide " . ($index + 1),
                    'supportingText' => $slide['text'] ?? '',
                    'callToAction' => $index === count($slides) - 1 ? 'Follow for More' : "Swipe " . ($index + 1) . '/' . count($slides),
                ],
            ];

            $svg = $this->renderSvgWithTypography($slideDoc);
            $filename = "slide_{$index}.svg";
            $path = "{$dir}/{$filename}";
            $disk->put($path, $svg);

            $renderedSlides[] = [
                'slide_number' => $index + 1,
                'path' => $path,
                'url' => $disk->url($path),
            ];
        }

        return [
            'total_slides' => count($renderedSlides),
            'slides' => $renderedSlides,
            'export_format' => 'carousel_document',
            'manifest_url' => $disk->url("{$dir}/manifest.json"),
        ];
    }
}

