<?php

namespace App\Console\Commands;

use App\Modules\Analytics\Services\AnalyticsSyncService;
use App\Modules\SocialConnectors\Models\SocialAccount;
use Illuminate\Console\Command;

class SyncAnalyticsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'analytics:sync {--account= : Specific social account ID}';

    /**
     * The console command description.
     */
    protected $description = 'Poll connected social accounts for post performance and daily metric snapshots';

    /**
     * Execute the console command.
     */
    public function handle(AnalyticsSyncService $syncService): int
    {
        $accountId = $this->option('account');

        $query = SocialAccount::where('connection_status', 'connected')->where('is_active', true);
        if ($accountId) {
            $query->where('id', $accountId);
        }

        $accounts = $query->get();
        $this->info("Syncing analytics for {$accounts->count()} connected social account(s)...");

        $totalSynced = 0;
        foreach ($accounts as $account) {
            $count = $syncService->syncAccountAnalytics($account);
            $totalSynced += $count;
            $this->line(" - [{$account->platform}: {$account->account_name}]: Synced {$count} post metric(s)");
        }

        $this->info("Analytics synchronization completed. Total posts refreshed: {$totalSynced}.");

        return self::SUCCESS;
    }
}

