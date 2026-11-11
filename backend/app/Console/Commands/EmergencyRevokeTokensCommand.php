<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class EmergencyRevokeTokensCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'emergency:revoke-tokens 
                            {--user= : Target user email or ID whose tokens should be revoked} 
                            {--all : Revoke all personal access tokens platform-wide}
                            {--force : Bypass confirmation prompt for automated operations}';

    /**
     * The console command description.
     */
    protected $description = 'Wipe compromised or leaked Personal Access Tokens for a specific user or platform-wide';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $userIdentifier = $this->option('user');
        $revokeAll = $this->option('all') || $userIdentifier === 'all';
        $force = $this->option('force');

        if ($revokeAll) {
            $count = DB::table('personal_access_tokens')->count();

            if (!$force && !$this->confirm("Are you sure you want to REVOKE ALL ({$count}) active tokens platform-wide? All users will be logged out immediately.", false)) {
                $this->line('Token revocation cancelled.');
                return self::SUCCESS;
            }

            DB::table('personal_access_tokens')->delete();

            SystemChangeLog::create([
                'user_id' => null,
                'entity_type' => 'sanctum_tokens',
                'entity_id' => 'all',
                'action' => 'tokens.emergency_wipe_all',
                'old_values' => ['active_count' => $count],
                'new_values' => ['active_count' => 0],
                'ip_address' => '127.0.0.1 (CLI)',
                'user_agent' => 'Artisan Console CLI',
                'created_at' => now(),
            ]);

            $this->error("🚨 ALL {$count} PERSONAL ACCESS TOKENS REVOKED PLATFORM-WIDE.");
            return self::SUCCESS;
        }

        if (!$userIdentifier) {
            $userIdentifier = $this->ask('Enter target user email address or user ID');
        }

        $user = User::where('email', $userIdentifier)
            ->orWhere('id', $userIdentifier)
            ->first();

        if (!$user) {
            $this->error("Error: No user found matching identifier: [{$userIdentifier}]");
            return self::FAILURE;
        }

        $tokenCount = $user->tokens()->count();
        $user->tokens()->delete();

        SystemChangeLog::create([
            'user_id' => $user->id,
            'entity_type' => 'sanctum_tokens',
            'entity_id' => $user->id,
            'action' => 'tokens.emergency_revoked_user',
            'old_values' => ['token_count' => $tokenCount],
            'new_values' => ['token_count' => 0],
            'ip_address' => '127.0.0.1 (CLI)',
            'user_agent' => 'Artisan Console CLI',
            'created_at' => now(),
        ]);

        $this->info("✅ Successfully revoked {$tokenCount} active token(s) for user: {$user->email}");

        return self::SUCCESS;
    }
}
