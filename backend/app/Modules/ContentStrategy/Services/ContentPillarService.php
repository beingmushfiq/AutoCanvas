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
}
