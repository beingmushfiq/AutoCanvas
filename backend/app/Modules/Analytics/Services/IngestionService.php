<?php

namespace App\Modules\Analytics\Services;

use App\Modules\Analytics\Models\Metric;
use App\Modules\SocialConnectors\Models\SocialAccount;

class IngestionService
{
    public function ingest(SocialAccount $account, string $metricName, float $value)
    {
        Metric::create([
            'organization_id' => $account->organization_id,
            'social_account_id' => $account->id,
            'metric_name' => $metricName,
            'value' => $value,
            'recorded_at' => now(),
        ]);
    }
}

