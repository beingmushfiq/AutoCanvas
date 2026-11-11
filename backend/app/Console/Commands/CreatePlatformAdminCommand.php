<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreatePlatformAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'control-plane:create-admin 
                            {--email= : The email of the admin user}
                            {--name= : The name of the admin user}
                            {--password= : The initial password}';

    /**
     * The console command description.
     */
    protected $description = 'Provision or promote a sovereign platform administrator account for Master Control';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('================================================================');
        $this->info('   🏛️  AUTOCANVAS SOVEREIGN PLATFORM ADMIN PROVISIONING  🏛️     ');
        $this->info('================================================================');

        $email = $this->option('email') ?: $this->ask('Enter administrator email address');
        $email = trim(strtolower($email));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error("Invalid email address format: [{$email}]");
            return self::FAILURE;
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            $this->warn("User [{$email}] already exists. Elevating to Platform Administrator...");
            $user->is_platform_admin = true;
            $user->status = 'active';

            $newPassword = $this->option('password');
            if ($newPassword || $this->confirm('Do you want to reset this user\'s password?', false)) {
                $password = $newPassword ?: $this->secret('Enter new password (min 8 characters)');
                if (strlen($password) < 8) {
                    $this->error('Password must be at least 8 characters.');
                    return self::FAILURE;
                }
                $user->password = Hash::make($password);
            }

            $user->save();
        } else {
            $name = $this->option('name') ?: $this->ask('Enter administrator full name', 'Platform Superadmin');
            $password = $this->option('password') ?: $this->secret('Enter password (min 8 characters)');

            if (strlen($password) < 8) {
                $this->error('Password must be at least 8 characters.');
                return self::FAILURE;
            }

            $user = User::create([
                'id' => (string) Str::ulid(),
                'name' => trim($name),
                'email' => $email,
                'password' => Hash::make($password),
                'is_platform_admin' => true,
                'status' => 'active',
                'email_verified_at' => now(),
            ]);

            $this->info("Created new user [{$email}].");
        }

        // Assign superadmin role if registered in RBAC
        $superadminRole = Role::where('name', 'superadmin')->first();
        if ($superadminRole) {
            $user->assignRole('superadmin');
        }

        // Ensure administrator has an active organization and workspace association for workspace operations
        if (! $user->current_organization_id || ! $user->current_workspace_id) {
            $defaultOrg = \App\Modules\Organization\Models\Organization::withoutGlobalScopes()->where('status', 'active')->first();
            if ($defaultOrg) {
                $defaultWs = $defaultOrg->defaultWorkspace ?? $defaultOrg->workspaces()->first();
                if ($defaultWs) {
                    $user->current_organization_id = $defaultOrg->id;
                    $user->current_workspace_id = $defaultWs->id;
                    $user->save();

                    \Illuminate\Support\Facades\DB::table('organization_members')->updateOrInsert(
                        ['organization_id' => $defaultOrg->id, 'user_id' => $user->id],
                        ['id' => (string) Str::ulid(), 'role' => 'owner', 'created_at' => now(), 'updated_at' => now()]
                    );

                    \Illuminate\Support\Facades\DB::table('workspace_members')->updateOrInsert(
                        ['workspace_id' => $defaultWs->id, 'user_id' => $user->id],
                        ['id' => (string) Str::ulid(), 'role' => 'owner', 'created_at' => now(), 'updated_at' => now()]
                    );
                    $this->info("Linked platform admin to default organization [{$defaultOrg->name}] and workspace [{$defaultWs->name}].");
                }
            }
        }

        // Record audit change log
        SystemChangeLog::create([
            'user_id' => $user->id,
            'entity_type' => 'user_privilege',
            'entity_id' => $user->id,
            'action' => 'user.platform_admin_provisioned',
            'old_values' => null,
            'new_values' => [
                'email' => $user->email,
                'is_platform_admin' => true,
                'role' => 'superadmin',
            ],
            'ip_address' => '127.0.0.1 (CLI)',
            'user_agent' => 'Artisan Console CLI',
            'created_at' => now(),
        ]);

        $this->info('================================================================');
        $this->info("👑 PLATFORM ADMIN READY: {$user->email}");
        $this->info('================================================================');
        $this->line("User ID: <comment>{$user->id}</comment>");
        $this->line("Name: <comment>{$user->name}</comment>");
        $this->line("Email: <comment>{$user->email}</comment>");
        $this->line("Platform Admin: <info>true</info>");

        return self::SUCCESS;
    }
}

