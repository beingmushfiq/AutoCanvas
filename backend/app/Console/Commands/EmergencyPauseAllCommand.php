<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use App\Modules\ControlPlane\Models\SystemSetting;
use Illuminate\Console\Command;

class EmergencyPauseAllCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'emergency:pause-all {--reason= : Operational justification for halting all automations}';

    /**
     * The console command description.
     */
    protected $description = 'Instantly activate the sovereign emergency circuit breaker and freeze all automations';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $reason = $this->option('reason') ?? 'CLI emergency pause triggered by system operator';

        $admin = User::where('is_platform_admin', true)->first();

        // 1. Persist emergency pause state
        SystemSetting::updateOrCreate(
            ['key' => 'pause_all_automations'],
            [
                'value' => true,
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
            'action' => 'circuit_breaker.cli_activated',
            'old_values' => ['paused' => false],
            'new_values' => ['paused' => true, 'reason' => $reason],
            'ip_address' => '127.0.0.1 (CLI)',
            'user_agent' => 'Artisan Console CLI',
            'created_at' => now(),
        ]);

        $this->error('================================================================');
        $this->error('🚨 EMERGENCY CIRCUIT BREAKER ACTIVATED: PAUSE_ALL_AUTOMATIONS 🚨');
        $this->error('================================================================');
        $this->line("Reason: <comment>{$reason}</comment>");
        $this->line('All publishing queues, scheduled dispatches, and autonomous cycles are FROZEN.');
        $this->line('To safely resume operations, run: <info>php artisan emergency:resume-all</info>');

        return self::SUCCESS;
    }
}

