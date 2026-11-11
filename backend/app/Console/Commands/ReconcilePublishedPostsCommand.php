<?php

namespace App\Console\Commands;

use App\Modules\Organization\Services\AuditLogger;
use App\Modules\Publishing\Models\PublishingDispatch;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ReconcilePublishedPostsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'publishing:reconcile {--timeout-minutes=15 : Minutes before a processing post is considered hung} {--dry-run : Preview reconciliation actions without saving}';

    /**
     * The console command description.
     */
    protected $description = 'Reconcile hung publishing dispatches and self-heal missing permalinks';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $timeoutMinutes = (int) $this->option('timeout-minutes');
        $dryRun = (bool) $this->option('dry-run');

        $this->info("Scanning publishing dispatches for reconciliation (timeout: {$timeoutMinutes}m, dry-run: " . ($dryRun ? 'YES' : 'NO') . ")...");

        $cutoff = Carbon::now()->subMinutes($timeoutMinutes);

        // 1. Identify stuck 'processing' dispatches
        $stuckDispatches = PublishingDispatch::withoutGlobalScopes()
            ->where('status', 'processing')
            ->where('updated_at', '<', $cutoff)
            ->get();

        $stuckCount = $stuckDispatches->count();
        $this->line("Found {$stuckCount} dispatches stuck in 'processing'.");

        foreach ($stuckDispatches as $dispatch) {
            $this->warn("Reconciling stuck dispatch [{$dispatch->id}] (Org: {$dispatch->organization_id}, attempts: {$dispatch->attempts})");

            if (!$dryRun) {
                // If post ID is present, it actually succeeded remotely before network died
                if (!empty($dispatch->platform_post_id)) {
                    $dispatch->update([
                        'status' => 'published',
                        'published_at' => $dispatch->published_at ?? Carbon::now(),
                    ]);
                    $dispatch->contentVariant?->update(['publishing_status' => 'published']);
                } else {
                    $dispatch->update([
                        'status' => 'failed',
                        'error_code' => 'PROCESSING_TIMEOUT_EXPIRED',
                        'error_message' => "Publishing timed out after {$timeoutMinutes} minutes without completion confirmation.",
                    ]);
                    $dispatch->contentVariant?->update(['publishing_status' => 'failed']);
                }

                AuditLogger::log(
                    'publishing.dispatch_reconciled',
                    $dispatch,
                    null,
                    ['reconcile_action' => $dispatch->status, 'reason' => 'stuck_processing'],
                    $dispatch->organization_id,
                    $dispatch->workspace_id
                );
            }
        }

        // 2. Identify 'published' dispatches missing canonical permalinks
        $missingPermalinks = PublishingDispatch::withoutGlobalScopes()
            ->where('status', 'published')
            ->whereNotNull('platform_post_id')
            ->where(function ($q) {
                $q->whereNull('platform_permalink')
                    ->orWhere('platform_permalink', '');
            })
            ->with('socialAccount')
            ->get();

        $healCount = $missingPermalinks->count();
        $this->line("Found {$healCount} published dispatches with missing permalinks.");

        foreach ($missingPermalinks as $dispatch) {
            $platform = $dispatch->socialAccount?->platform ?? $dispatch->payload_snapshot['platform'] ?? 'generic';
            $postId = $dispatch->platform_post_id;

            $permalink = match ($platform) {
                'facebook' => "https://facebook.com/{$postId}",
                'instagram' => "https://instagram.com/p/{$postId}",
                'linkedin' => "https://www.linkedin.com/feed/update/{$postId}",
                default => "https://social.platform/post/{$postId}",
            };

            $this->info("Self-healing permalink for dispatch [{$dispatch->id}] -> {$permalink}");

            if (!$dryRun) {
                $dispatch->update(['platform_permalink' => $permalink]);
            }
        }

        $this->info("Publishing reconciliation completed successfully. Reconciled: {$stuckCount}, Self-healed: {$healCount}.");

        return self::SUCCESS;
    }
}

