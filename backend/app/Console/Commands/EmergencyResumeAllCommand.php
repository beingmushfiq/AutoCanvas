<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use App\Modules\ControlPlane\Models\SystemSetting;
use Illuminate\Console\Command;

class EmergencyResumeAllCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'emergency:resume-all {--reason= : Operational justification for resuming automations}';

    /**
     * The console command description.
     */
    protected $description = 'Deactivate the sovereign emergency circuit breaker and resume autonomous publishing';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $reason = $this->option('reason') ?? 'CLI operational resumption triggered by system operator';

        $admin = User::where('is_platform_admin', true)->first();

        // 1. Persist resume state
        SystemSetting::updateOrCreate(
            ['key' => 'pause_all_automations'],
            [
                'value' => false,
                'category' => 'emergency',
                'is_secret' => false,
                'updated_by' => $admin?->id,
            ]
        );

        // 2. Log out-of-band audit entry
        SystemChangeLog::create([
            'user_id' => $admin?->id,
            'entity_type' => 'emergency_circuit_breaker',
            'entity_id' => 'pause_all_automations',
            'action' => 'circuit_breaker.cli_deactivated',
            'old_values' => ['paused' => true],
            'new_values' => ['paused' => false, 'reason' => $reason],
            'ip_address' => '127.0.0.1 (CLI)',
            'user_agent' => 'Artisan Console CLI',
            'created_at' => now(),
        ]);

        $this->info('================================================================');
        $this->info('✅ EMERGENCY CIRCUIT BREAKER DEACTIVATED: PLATFORM RESUMED     ✅');
        $this->info('================================================================');
        $this->line("Reason: <comment>{$reason}</comment>");
        $this->line('Autonomous queue dispatches and scheduled publishing cycles are now OPERATIONAL.');

        return self::SUCCESS;
    }
}

