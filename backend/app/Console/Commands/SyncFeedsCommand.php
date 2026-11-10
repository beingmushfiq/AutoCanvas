<?php

namespace App\Console\Commands;

use App\Modules\Research\Services\RssIngestionService;
use Illuminate\Console\Command;

class SyncFeedsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'research:sync-feeds {--limit=20 : Maximum number of feeds to sync}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch and ingest new articles from all due RSS feeds';

    /**
     * Execute the console command.
     */
    public function handle(RssIngestionService $service): int
    {
        $limit = (int) $this->option('limit');
        $this->info("Scanning for due RSS feeds (limit: {$limit})...");

        $synced = $service->syncDueFeeds($limit);

        $this->info("Successfully synced {$synced} new articles.");

        return Command::SUCCESS;
    }
}
