<?php

namespace App\Console\Commands;

use App\Modules\SocialConnectors\Models\SocialAccount;
use App\Modules\SocialConnectors\Services\OAuthManager;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MonitorSocialTokensCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'social:check-tokens {--days=7 : Threshold days before expiration to flag or refresh}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitor connected social accounts, automatically refresh expiring tokens, and update status.';

    /**
     * Execute the console command.
     */
    public function handle(OAuthManager $oauthManager): int
    {
        $days = (int) $this->option('days');
        $threshold = Carbon::now()->addDays($days);

        $this->info("Scanning for social accounts expiring before {$threshold->toIso8601String()}...");

        $expiringAccounts = SocialAccount::withoutGlobalScopes()
            ->where('is_active', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $threshold)
            ->get();

        $this->info("Found {$expiringAccounts->count()} accounts requiring token verification/refresh.");

        $refreshed = 0;
        $expired = 0;

        foreach ($expiringAccounts as $account) {
            $this->line("Checking account [{$account->id}] ({$account->platform} - {$account->account_name})...");

            try {
                if ($account->expires_at->isPast()) {
                    $account->update(['connection_status' => 'expired']);
                    $expired++;
                    $this->warn("Account [{$account->id}] is already expired.");
                    continue;
                }

                if (!empty($account->refresh_token)) {
                    $oauthManager->refreshAccountToken($account);
                    $refreshed++;
                    $this->info("Successfully refreshed token for account [{$account->id}]. New expiry: {$account->expires_at}.");
                } else {
                    // Test token validity
                    $isValid = $oauthManager->testConnection($account);
                    if ($isValid) {
                        $this->info("Account [{$account->id}] token is still valid on remote API.");
                    } else {
                        $account->update(['connection_status' => 'expired']);
                        $expired++;
                        $this->warn("Account [{$account->id}] token rejected by platform. Marked as expired.");
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Failed to refresh social account [{$account->id}]: {$e->getMessage()}");
                $account->update(['connection_status' => 'expired']);
                $expired++;
                $this->error("Error refreshing [{$account->id}]: {$e->getMessage()}");
            }
        }

        $this->info("Social token monitoring complete. Refreshed: {$refreshed}, Expired/Flagged: {$expired}.");

        return Command::SUCCESS;
    }
}

