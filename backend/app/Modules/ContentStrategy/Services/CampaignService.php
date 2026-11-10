<?php

namespace App\Modules\ContentStrategy\Services;

use App\Modules\Brand\Models\Brand;
use App\Modules\ContentStrategy\Models\Campaign;
use App\Modules\Organization\Services\AuditLogger;
use Illuminate\Support\Str;

class CampaignService
{
    /**
     * Create a campaign for a brand.
     */
    public function createCampaign(Brand $brand, array $data): Campaign
    {
        $baseSlug = Str::slug($data['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (Campaign::where('brand_id', $brand->id)->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $campaign = Campaign::create([
            'organization_id' => $brand->organization_id,
            'workspace_id' => $brand->workspace_id,
            'brand_id' => $brand->id,
            'content_pillar_id' => $data['content_pillar_id'] ?? null,
            'name' => $data['name'],
            'slug' => $slug,
            'objective' => $data['objective'] ?? null,
            'key_messaging' => $data['key_messaging'] ?? null,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'status' => $data['status'] ?? 'planning',
        ]);

        AuditLogger::log('campaign.created', $campaign, null, ['name' => $campaign->name], $brand->organization_id, $brand->workspace_id);

        return $campaign;
    }

    /**
     * Update campaign.
     */
    public function updateCampaign(Campaign $campaign, array $data): Campaign
    {
        $before = $campaign->toArray();
        $campaign->update($data);
        AuditLogger::log('campaign.updated', $campaign, $before, $data, $campaign->organization_id);

        return $campaign;
    }

    /**
     * Delete campaign.
     */
    public function deleteCampaign(Campaign $campaign): void
    {
        AuditLogger::log('campaign.deleted', $campaign, ['name' => $campaign->name], null, $campaign->organization_id);
        $campaign->delete();
    }
}
