<?php

namespace App\Console\Commands;

use App\Modules\Community\Services\InboxSyncService;
use App\Modules\SocialConnectors\Models\SocialAccount;
use Illuminate\Console\Command;

class SyncInboxCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'inbox:sync {--account= : Specific social account ID}';

    /**
     * The console command description.
     */
    protected $description = 'Poll connected social accounts for new comments, mentions, and community messages';

    /**
     * Execute the console command.
     */
    public function handle(InboxSyncService $syncService): int
    {
        $accountId = $this->option('account');

        $query = SocialAccount::where('connection_status', 'connected')->where('is_active', true);
        if ($accountId) {
            $query->where('id', $accountId);
        }

        $accounts = $query->get();
        $this->info("Scanning inbox feeds for {$accounts->count()} active connected account(s)...");

        $totalIngested = 0;
        foreach ($accounts as $account) {
            $count = $syncService->syncAccount($account);
            $totalIngested += $count;
            $this->line(" - [{$account->platform}: {$account->account_name}]: Ingested {$count} item(s)");
        }

        $this->info("Inbox sync completed. Total messages/comments synced: {$totalIngested}.");

        return self::SUCCESS;
    }
}

