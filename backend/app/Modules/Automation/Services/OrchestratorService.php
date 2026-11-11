<?php

namespace App\Modules\Automation\Services;

use App\Modules\Automation\Models\AutomationLog;
use Illuminate\Support\Facades\Cache;

class OrchestratorService
{
    public function isPaused(string $organizationId): bool
    {
        return Cache::get("automation_paused_{$organizationId}", false);
    }

    public function pause(string $organizationId)
    {
        Cache::put("automation_paused_{$organizationId}", true);
    }

    public function resume(string $organizationId)
    {
        Cache::forget("automation_paused_{$organizationId}");
    }

    public function runPlanningCycle(string $organizationId)
    {
        if ($this->isPaused($organizationId)) {
            return;
        }

        // Run planning cycle logic
        AutomationLog::create([
            'organization_id' => $organizationId,
            'cycle_type' => 'hourly_plan',
            'status' => 'success',
            'output' => 'Planning cycle completed',
        ]);
    }
}

