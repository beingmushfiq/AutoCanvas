<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use Illuminate\Console\Command;

class EmergencyPromoteAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'emergency:promote-admin {email : The email of the user to grant sovereign admin access}';

    /**
     * The console command description.
     */
    protected $description = 'Grant sovereign platform superadmin privileges and assign superadmin role to a user';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = trim($this->argument('email'));

        $user = User::where('email', $email)->first();
        if (!$user) {
            $this->error("Error: No user found with email address: [{$email}]");
            return self::FAILURE;
        }

        // 1. Promote to platform admin
        $wasAdmin = $user->is_platform_admin;
        $user->is_platform_admin = true;
        $user->status = 'active';
        $user->save();

        // 2. Assign superadmin role if registered
        $superadminRole = Role::where('name', 'superadmin')->first();
        if ($superadminRole) {
            $user->assignRole('superadmin');
        }

        // 3. Log out-of-band audit trail
        SystemChangeLog::create([
            'user_id' => $user->id,
            'entity_type' => 'user_privilege',
            'entity_id' => $user->id,
            'action' => 'user.emergency_promoted_admin',
            'old_values' => ['is_platform_admin' => $wasAdmin],
            'new_values' => ['is_platform_admin' => true, 'role' => 'superadmin'],
            'ip_address' => '127.0.0.1 (CLI)',
            'user_agent' => 'Artisan Console CLI',
            'created_at' => now(),
        ]);

        $this->info('================================================================');
        $this->info("👑 USER PROMOTED TO PLATFORM ADMIN: {$user->email}             👑");
        $this->info('================================================================');
        $this->line("User ID: <comment>{$user->id}</comment>");
        $this->line("Name: <comment>{$user->name}</comment>");
        $this->line("Platform Admin: <info>true</info>");
        $this->line("Assigned Role: <info>superadmin</info>");

        return self::SUCCESS;
    }
}

