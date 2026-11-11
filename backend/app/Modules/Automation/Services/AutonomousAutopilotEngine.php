<?php

namespace App\Modules\Automation\Services;

use App\Models\User;
use App\Modules\Automation\Models\BrandCadenceSetting;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentProduction\Services\ContentGenerationService;
use App\Modules\ControlPlane\Services\SystemSettingsService;
use App\Modules\Publishing\Models\PublishingDispatch;
use App\Modules\Research\Models\DiscoveredSource;
use App\Modules\Research\Models\FeedArticle;
use App\Modules\Research\Models\RssFeed;
use App\Modules\Research\Models\SourceCluster;
use App\Modules\Research\Services\NoveltyVerificationEngine;
use App\Modules\Research\Services\RelatedSourceDiscoveryService;
use App\Modules\Research\Services\TrendAnalysisService;
use Carbon\Carbon;
use Illuminate\Support\Str;

class AutonomousAutopilotEngine
{
    public function __construct(
        protected SystemSettingsService $settingsService,
        protected RelatedSourceDiscoveryService $discoveryService,
        protected TrendAnalysisService $trendService,
        protected NoveltyVerificationEngine $noveltyEngine,
        protected ContentGenerationService $contentGenService
    ) {}

    /**
     * Run the complete autonomous hourly cycle for a brand.
     */
    public function runCycle(Brand $brand, array $options = []): array
    {
        // 1. Check Sovereign Emergency Circuit Breaker
        if ($this->settingsService->get('pause_all_automations', false)) {
            return [
                'status' => 'circuit_breaker_paused',
                'message' => 'Emergency circuit breaker is active. All autonomous operations frozen.',
                'posts_minted' => 0,
            ];
        }

        // 2. Fetch or initialize Brand Cadence Setting
        $cadence = BrandCadenceSetting::firstOrCreate(
            ['brand_id' => $brand->id],
            [
                'organization_id' => $brand->organization_id,
                'workspace_id' => $brand->workspace_id,
                'autopilot_mode' => 'copilot_manual',
                'weekly_schedule' => [
                    ['day' => 'mon', 'time' => '10:00', 'channel' => 'linkedin'],
                    ['day' => 'wed', 'time' => '14:00', 'channel' => 'facebook'],
                    ['day' => 'fri', 'time' => '18:00', 'channel' => 'instagram'],
                ],
                'novelty_threshold_cosine' => 0.720,
                'max_daily_posts_per_channel' => 2,
                'require_consensus_for_breaking_news' => true,
                'is_active' => true,
            ]
        );

        if (!$cadence->is_active) {
            return [
                'status' => 'cadence_inactive',
                'message' => 'Cadence scheduling is currently disabled for this brand.',
                'posts_minted' => 0,
            ];
        }

        // 3. Hourly Related Source Discovery & Scour Update
        $discovered = $this->discoveryService->discoverSources($brand, ['limit' => 3]);
        DiscoveredSource::where('brand_id', $brand->id)
            ->where('status', 'active')
            ->update(['last_scoured_at' => now()]);

        // 4. Cluster Recent Feed Articles into Entity Momentum Clusters
        $this->clusterRecentArticles($brand);

        // 5. Generate / Detect High-Value Content Opportunities
        $opportunities = $this->trendService->detectOpportunities($brand, ['limit' => 3]);

        // 6. Inspect 72-Hour Calendar Horizon for Empty Slots
        $emptySlots = $this->identifyEmptyCadenceSlots($brand, $cadence);

        $postsMinted = 0;
        $rejectedDuplicates = 0;
        $systemUser = User::where('is_platform_admin', true)->first() 
            ?? User::where('organization_id', $brand->organization_id)->first();

        // 7. Fulfill Empty Slots with Novel, Certified Content
        foreach ($emptySlots as $slot) {
            if ($postsMinted >= $cadence->max_daily_posts_per_channel) {
                break;
            }

            $opp = $opportunities->first();
            $topic = $opp ? "{$opp->title} - {$opp->angle}" : "Industry Innovation and Strategic Insights in {$brand->industry}";

            $templateId = 'minimal_corporate_v1';
            $channel = $slot['channel'];

            // Generate Candidate Content
            $contentItem = $this->contentGenService->generate($brand, [
                'topic' => $topic,
                'platforms' => [$channel],
                'generate_creative' => true,
            ], $systemUser);

            $variant = $contentItem->variants()->where('channel', $channel)->first();
            $hook = $variant?->caption ? Str::limit($variant->caption, 80) : $topic;

            // Run 3-Layer Novelty & Deduplication Gate with Bounded Circuit Breaker
            $accumulatedRejections = [];
            $attempt = 1;
            $noveltyReport = null;

            while ($attempt <= NoveltyVerificationEngine::MAX_REFRAME_ATTEMPTS) {
                $noveltyReport = $this->noveltyEngine->evaluateNovelty(
                    $brand,
                    $channel,
                    $hook,
                    $topic,
                    $templateId,
                    null,
                    $accumulatedRejections,
                    $attempt
                );

                if ($noveltyReport['is_novel']) {
                    break;
                }

                $rejectedDuplicates++;
                $accumulatedRejections = $noveltyReport['accumulated_rejections'] ?? array_merge($accumulatedRejections, [$hook]);

                if (!empty($noveltyReport['escalate_to_human'])) {
                    break;
                }

                // Apply Angle Mutation and Template Rotation for next attempt
                if (!empty($noveltyReport['mutated_angle'])) {
                    $topic = $noveltyReport['mutated_angle'];
                    $hook = Str::limit($topic, 80);
                    $contentItem->update([
                        'topic' => $topic,
                        'concept' => $topic,
                    ]);
                }

                if (!empty($noveltyReport['recommended_template'])) {
                    $templateId = $noveltyReport['recommended_template'];
                }

                $attempt++;
            }

            // If circuit breaker tripped or maximum attempts reached without novel certification
            if (!$noveltyReport || !$noveltyReport['is_novel']) {
                $contentItem->update([
                    'status' => 'needs_human_angle',
                    'notes' => 'Novelty gate escalated to human review after ' . ($attempt - 1) . ' failed angle mutations.',
                ]);
                continue; // Do not schedule or dispatch unverified item
            }

            // Register Certified Novelty Fingerprint
            $this->noveltyEngine->registerFingerprint(
                $brand,
                $contentItem,
                $channel,
                $hook,
                $contentItem->concept ?? $topic,
                $templateId
            );

            // Schedule for Target Slot Time in Publishing Queue
            if ($cadence->autopilot_mode === 'full_autonomous') {
                $contentItem->status = 'scheduled';
                $contentItem->save();

                // Stage into Publishing Dispatches
                PublishingDispatch::create([
                    'organization_id' => $brand->organization_id,
                    'workspace_id' => $brand->workspace_id,
                    'brand_id' => $brand->id,
                    'content_item_id' => $contentItem->id,
                    'content_variant_id' => $variant?->id,
                    'social_account_id' => null,
                    'scheduled_at' => $slot['slot_datetime'],
                    'status' => 'queued',
                    'idempotency_key' => hash('sha256', "{$contentItem->id}_{$channel}_{$slot['slot_datetime']->timestamp}"),
                    'attempts' => 0,
                ]);
            } else {
                $contentItem->status = 'review';
                $contentItem->save();
            }

            $postsMinted++;
        }

        $cadence->update(['last_cycle_run_at' => now()]);

        return [
            'status' => 'success',
            'brand' => $brand->name,
            'autopilot_mode' => $cadence->autopilot_mode,
            'sources_discovered' => $discovered->count(),
            'opportunities_found' => $opportunities->count(),
            'empty_slots_found' => count($emptySlots),
            'posts_minted' => $postsMinted,
            'duplicates_rejected_and_mutated' => $rejectedDuplicates,
            'cycle_timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Group recent feed articles into entity clusters to track news momentum.
     */
    protected function clusterRecentArticles(Brand $brand): void
    {
        $feedIds = RssFeed::where('brand_id', $brand->id)->pluck('id');
        $recentArticles = FeedArticle::whereIn('rss_feed_id', $feedIds)
            ->latest()
            ->take(20)
            ->get();

        if ($recentArticles->isEmpty()) {
            return;
        }

        foreach ($recentArticles as $art) {
            $words = array_filter(explode(' ', preg_replace('/[^\w\s]/', '', $art->title)));
            $primaryEntity = count($words) > 0 ? $words[0] : 'Industry';

            $cluster = SourceCluster::firstOrCreate(
                [
                    'brand_id' => $brand->id,
                    'primary_entity' => $primaryEntity,
                ],
                [
                    'organization_id' => $brand->organization_id,
                    'workspace_id' => $brand->workspace_id,
                    'cluster_title' => $art->title,
                    'summary' => $art->summary,
                    'article_count' => 1,
                    'momentum_score' => 65,
                    'source_domains' => ['news.google.com'],
                    'has_consensus' => true,
                    'first_seen_at' => now(),
                    'last_seen_at' => now(),
                ]
            );

            if (!$cluster->wasRecentlyCreated) {
                $cluster->increment('article_count');
                $cluster->update([
                    'last_seen_at' => now(),
                    'momentum_score' => min(100, $cluster->momentum_score + 10),
                ]);
            }
        }
    }

    /**
     * Identify unfulfilled calendar slots within the next 72 hours.
     */
    protected function identifyEmptyCadenceSlots(Brand $brand, BrandCadenceSetting $cadence): array
    {
        $weeklySchedule = $cadence->weekly_schedule ?? [];
        if (empty($weeklySchedule)) {
            return [];
        }

        $emptySlots = [];
        $now = Carbon::now();

        // Check next 3 days
        for ($i = 0; $i < 3; $i++) {
            $date = $now->copy()->addDays($i);
            $dayName = strtolower($date->format('D')); // 'mon', 'tue', etc.

            foreach ($weeklySchedule as $sched) {
                $targetDay = strtolower(substr($sched['day'] ?? '', 0, 3));
                if ($targetDay === $dayName) {
                    $timeParts = explode(':', $sched['time'] ?? '12:00');
                    $slotDateTime = $date->copy()->setTime((int) ($timeParts[0] ?? 12), (int) ($timeParts[1] ?? 0), 0);

                    if ($slotDateTime->isPast()) {
                        continue;
                    }

                    // Check if a post is already scheduled for this channel within ±2 hours in publishing_dispatches
                    $exists = PublishingDispatch::where('brand_id', $brand->id)
                        ->whereBetween('scheduled_at', [
                            $slotDateTime->copy()->subHours(2),
                            $slotDateTime->copy()->addHours(2),
                        ])
                        ->exists();

                    if (!$exists) {
                        $emptySlots[] = [
                            'channel' => $sched['channel'] ?? 'linkedin',
                            'slot_datetime' => $slotDateTime,
                        ];
                    }
                }
            }
        }

        return $emptySlots;
    }
}
