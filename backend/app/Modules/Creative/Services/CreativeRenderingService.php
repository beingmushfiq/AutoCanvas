<?php

namespace App\Modules\Creative\Services;

use App\Modules\Brand\Models\Brand;
use App\Modules\Creative\Models\CreativeDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CreativeRenderingService
{
    public function __construct(
        protected ChromiumRendererClient $chromiumClient
    ) {}

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
     * Render creative document to public storage and persist CreativeDocument record.
     */
    public function render(Brand $brand, array $options): array
    {
        $templateId = $options['template_id'] ?? 'minimal_corporate_v1';
        $width = (int) ($options['width'] ?? 1080);
        $height = (int) ($options['height'] ?? 1080);
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';

        $headline = $options['headline'] ?? $brand->name;
        $supportingText = $options['supporting_text'] ?? null;
        $cta = $options['call_to_action'] ?? ($brand->profile?->primary_cta ?? 'Learn More');
        $name = $options['name'] ?? ($headline ?: 'Untitled Creative');

        $docPayload = [
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

        $filename = 'creative_' . Str::ulid();
        $relativeDir = "brands/{$brand->id}/creatives";

        // 1. Attempt rendering via Playwright Chromium daemon
        $imageBytes = $this->chromiumClient->render($docPayload);
        $engine = 'playwright_chromium';
        $format = 'png';

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        if ($imageBytes !== null) {
            $imagePath = "{$relativeDir}/{$filename}.png";
            $disk->put($imagePath, $imageBytes);
            $assetUrl = $disk->url($imagePath);
        } else {
            // 2. Graceful deterministic SVG fallback
            $engine = 'deterministic_svg_fallback';
            $format = 'svg';
            $svgContent = $this->composeFallbackSvg($docPayload);
            $imagePath = "{$relativeDir}/{$filename}.svg";
            $disk->put($imagePath, $svgContent);
            $assetUrl = $disk->url($imagePath);
        }

        // 3. Persist or update CreativeDocument model
        $creativeDoc = CreativeDocument::create([
            'organization_id' => $brand->organization_id,
            'workspace_id' => $brand->workspace_id,
            'brand_id' => $brand->id,
            'content_item_id' => $options['content_item_id'] ?? null,
            'content_variant_id' => $options['content_variant_id'] ?? null,
            'name' => $name,
            'template_id' => $templateId,
            'aspect_ratio' => $aspectRatio,
            'width' => $width,
            'height' => $height,
            'layers' => $options['layers'] ?? [
                'headline' => ['text' => $headline],
                'supporting' => ['text' => $supportingText],
                'cta' => ['text' => $cta],
            ],
            'background_config' => [
                'color' => $docPayload['backgroundColor'],
            ],
            'rendered_asset_url' => $assetUrl,
            'render_status' => 'rendered',
            'render_engine' => $engine,
        ]);

        return [
            'success' => true,
            'document_id' => $creativeDoc->id,
            'file_path' => $imagePath,
            'file_url' => $assetUrl,
            'format' => $format,
            'width' => $width,
            'height' => $height,
            'renderer' => $engine,
            'creative_document' => $docPayload,
            'model' => $creativeDoc,
        ];
    }

    /**
     * Re-render an existing CreativeDocument.
     */
    public function renderDocument(CreativeDocument $document): CreativeDocument
    {
        $brand = $document->brand;
        $docPayload = [
            'width' => $document->width,
            'height' => $document->height,
            'backgroundColor' => $document->background_config['color'] ?? '#101828',
            'brand' => [
                'name' => $brand->name,
                'logoUrl' => $brand->visualIdentity?->primary_logo_url,
                'primaryColor' => $brand->visualIdentity?->secondary_color ?? '#6257E8',
                'secondaryColor' => $brand->visualIdentity?->accent_colors[0] ?? '#24A0A8',
            ],
            'content' => [
                'headline' => $document->layers['headline']['text'] ?? $document->name,
                'supportingText' => $document->layers['supporting']['text'] ?? null,
                'callToAction' => $document->layers['cta']['text'] ?? 'Learn More',
            ],
            'templateId' => $document->template_id,
        ];

        $filename = 'creative_' . Str::ulid();
        $relativeDir = "brands/{$brand->id}/creatives";

        $imageBytes = $this->chromiumClient->render($docPayload);

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        if ($imageBytes !== null) {
            $imagePath = "{$relativeDir}/{$filename}.png";
            $disk->put($imagePath, $imageBytes);
            $assetUrl = $disk->url($imagePath);
            $engine = 'playwright_chromium';
        } else {
            $imagePath = "{$relativeDir}/{$filename}.svg";
            $svgContent = $this->composeFallbackSvg($docPayload);
            $disk->put($imagePath, $svgContent);
            $assetUrl = $disk->url($imagePath);
            $engine = 'deterministic_svg_fallback';
        }

        $document->update([
            'rendered_asset_url' => $assetUrl,
            'render_status' => 'rendered',
            'render_engine' => $engine,
        ]);

        return $document;
    }

    /**
     * Generate valid, standalone SVG creative fallback.
     */
    public function composeFallbackSvg(array $doc): string
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
