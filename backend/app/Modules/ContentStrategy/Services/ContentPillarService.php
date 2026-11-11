<?php

namespace App\Modules\ContentStrategy\Services;

use App\Modules\Brand\Models\Brand;
use App\Modules\ContentStrategy\Models\ContentPillar;
use App\Modules\Organization\Services\AuditLogger;
use Illuminate\Support\Str;

class ContentPillarService
{
    /**
     * Create a content pillar for a brand.
     */
    public function createPillar(Brand $brand, array $data): ContentPillar
    {
        $baseSlug = Str::slug($data['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (ContentPillar::where('brand_id', $brand->id)->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $pillar = ContentPillar::create([
            'organization_id' => $brand->organization_id,
            'workspace_id' => $brand->workspace_id,
            'brand_id' => $brand->id,
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'target_audience' => $data['target_audience'] ?? null,
            'weight_percentage' => $data['weight_percentage'] ?? 20,
            'color_tag' => $data['color_tag'] ?? '#6257E8',
            'status' => 'active',
        ]);

        AuditLogger::log('content_pillar.created', $pillar, null, ['name' => $pillar->name], $brand->organization_id, $brand->workspace_id);

        return $pillar;
    }

    /**
     * Update content pillar.
     */
    public function updatePillar(ContentPillar $pillar, array $data): ContentPillar
    {
        $before = $pillar->toArray();
        $pillar->update($data);
        AuditLogger::log('content_pillar.updated', $pillar, $before, $data, $pillar->organization_id);

        return $pillar;
    }

    /**
     * Delete content pillar.
     */
    public function deletePillar(ContentPillar $pillar): void
    {
        AuditLogger::log('content_pillar.deleted', $pillar, ['name' => $pillar->name], null, $pillar->organization_id);
        $pillar->delete();
    }

    /**
     * Calculate strategic pillar allocation balance and identify under/over-represented pillars.
     */
    public function calculateBalance(Brand $brand): array
    {
        $pillars = ContentPillar::where('brand_id', $brand->id)
            ->where('status', 'active')
            ->withCount('contentItems')
            ->get();

        $totalItems = $pillars->sum('content_items_count');
        $distribution = [];
        $recommendedPillar = null;
        $lowestGap = 999;

        foreach ($pillars as $pillar) {
            $targetWeight = (float) $pillar->weight_percentage;
            $actualShare = $totalItems > 0
                ? round(($pillar->content_items_count / $totalItems) * 100, 1)
                : 0.0;

            $gap = $actualShare - $targetWeight;

            $status = 'balanced';
            if ($gap < -5.0 || ($totalItems > 0 && $pillar->content_items_count === 0)) {
                $status = 'under_represented';
            } elseif ($gap > 5.0) {
                $status = 'over_represented';
            }

            if ($gap < $lowestGap) {
                $lowestGap = $gap;
                $recommendedPillar = $pillar;
            }

            $distribution[] = [
                'id' => $pillar->id,
                'name' => $pillar->name,
                'slug' => $pillar->slug,
                'target_percentage' => $targetWeight,
                'actual_percentage' => $actualShare,
                'post_count' => $pillar->content_items_count,
                'gap' => $gap,
                'status' => $status,
                'color_tag' => $pillar->color_tag,
            ];
        }

        return [
            'brand_id' => $brand->id,
            'total_posts' => $totalItems,
            'pillars' => $distribution,
            'recommended_pillar' => $recommendedPillar ? [
                'id' => $recommendedPillar->id,
                'name' => $recommendedPillar->name,
                'color_tag' => $recommendedPillar->color_tag,
                'target_percentage' => $recommendedPillar->weight_percentage,
            ] : null,
        ];
    }

    /**
     * Get the next recommended content pillar to maintain balanced editorial ratios.
     */
    public function getRecommendedPillar(Brand $brand): ?ContentPillar
    {
        $balance = $this->calculateBalance($brand);
        if (!empty($balance['recommended_pillar']['id'])) {
            return ContentPillar::find($balance['recommended_pillar']['id']);
        }

        return ContentPillar::where('brand_id', $brand->id)->where('status', 'active')->first();
    }
}
