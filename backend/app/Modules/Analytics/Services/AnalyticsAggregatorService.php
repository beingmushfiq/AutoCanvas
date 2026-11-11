<?php

namespace App\Modules\Analytics\Services;

use App\Modules\Analytics\Models\AnalyticsSnapshot;
use App\Modules\Analytics\Models\PostAnalytics;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentStrategy\Models\ContentPillar;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class AnalyticsAggregatorService
{
    /**
     * Compute high-level KPI overview with period-over-period delta percentages.
     */
    public function getBrandOverview(Brand $brand, Carbon $startDate, Carbon $endDate): array
    {
        $durationDays = max(1, $startDate->diffInDays($endDate) + 1);
        $prevStartDate = $startDate->copy()->subDays($durationDays);
        $prevEndDate = $startDate->copy()->subDay();

        $startStr = $startDate->toDateString();
        $endStr = $endDate->toDateString();
        $prevStartStr = $prevStartDate->toDateString();
        $prevEndStr = $prevEndDate->toDateString();

        // 1. Current Period Aggregations
        $current = AnalyticsSnapshot::where('brand_id', $brand->id)
            ->where(function ($q) use ($startStr, $endStr) {
                $q->whereBetween('snapshot_date', [$startStr, $endStr])
                  ->orWhereBetween('snapshot_date', [$startStr . ' 00:00:00', $endStr . ' 23:59:59']);
            })
            ->selectRaw('
                COALESCE(SUM(impressions), 0) as total_impressions,
                COALESCE(SUM(reach), 0) as total_reach,
                COALESCE(SUM(engagements), 0) as total_engagements,
                COALESCE(SUM(clicks), 0) as total_clicks,
                COALESCE(SUM(video_views), 0) as total_video_views,
                COALESCE(SUM(net_follower_change), 0) as total_follower_growth
            ')
            ->first();

        // 2. Previous Period Aggregations
        $previous = AnalyticsSnapshot::where('brand_id', $brand->id)
            ->where(function ($q) use ($prevStartStr, $prevEndStr) {
                $q->whereBetween('snapshot_date', [$prevStartStr, $prevEndStr])
                  ->orWhereBetween('snapshot_date', [$prevStartStr . ' 00:00:00', $prevEndStr . ' 23:59:59']);
            })
            ->selectRaw('
                COALESCE(SUM(impressions), 0) as total_impressions,
                COALESCE(SUM(reach), 0) as total_reach,
                COALESCE(SUM(engagements), 0) as total_engagements,
                COALESCE(SUM(clicks), 0) as total_clicks,
                COALESCE(SUM(video_views), 0) as total_video_views,
                COALESCE(SUM(net_follower_change), 0) as total_follower_growth
            ')
            ->first();

        $calcDelta = function ($curr, $prev): float {
            if ($prev == 0) {
                return $curr > 0 ? 100.0 : 0.0;
            }
            return round((($curr - $prev) / $prev) * 100, 1);
        };

        $currImpressions = (int) ($current->total_impressions ?? 0);
        $currEngagements = (int) ($current->total_engagements ?? 0);
        $currReach = (int) ($current->total_reach ?? 0);
        $currClicks = (int) ($current->total_clicks ?? 0);
        $currFollowers = (int) ($current->total_follower_growth ?? 0);

        $prevImpressions = (int) ($previous->total_impressions ?? 0);
        $prevEngagements = (int) ($previous->total_engagements ?? 0);
        $prevReach = (int) ($previous->total_reach ?? 0);
        $prevClicks = (int) ($previous->total_clicks ?? 0);
        $prevFollowers = (int) ($previous->total_follower_growth ?? 0);

        $avgEngRate = $currImpressions > 0
            ? round(($currEngagements / $currImpressions) * 100, 2)
            : 0.0;

        $prevAvgEngRate = $prevImpressions > 0
            ? round(($prevEngagements / $prevImpressions) * 100, 2)
            : 0.0;

        return [
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'duration_days' => $durationDays,
            ],
            'kpis' => [
                'impressions' => [
                    'value' => $currImpressions,
                    'delta_percent' => $calcDelta($currImpressions, $prevImpressions),
                ],
                'reach' => [
                    'value' => $currReach,
                    'delta_percent' => $calcDelta($currReach, $prevReach),
                ],
                'engagements' => [
                    'value' => $currEngagements,
                    'delta_percent' => $calcDelta($currEngagements, $prevEngagements),
                ],
                'clicks' => [
                    'value' => $currClicks,
                    'delta_percent' => $calcDelta($currClicks, $prevClicks),
                ],
                'follower_growth' => [
                    'value' => $currFollowers,
                    'delta_percent' => $calcDelta($currFollowers, $prevFollowers),
                ],
                'engagement_rate' => [
                    'value' => $avgEngRate,
                    'delta_percent' => $calcDelta($avgEngRate, $prevAvgEngRate),
                ],
            ],
        ];
    }

    /**
     * Compute daily time-series sequence for charts with contiguous date coverage.
     */
    public function getTimeSeries(Brand $brand, Carbon $startDate, Carbon $endDate, ?string $platform = null): array
    {
        $startStr = $startDate->toDateString();
        $endStr = $endDate->toDateString();

        $query = AnalyticsSnapshot::where('brand_id', $brand->id)
            ->where(function ($q) use ($startStr, $endStr) {
                $q->whereBetween('snapshot_date', [$startStr, $endStr])
                  ->orWhereBetween('snapshot_date', [$startStr . ' 00:00:00', $endStr . ' 23:59:59']);
            });

        if ($platform && $platform !== 'all') {
            $query->where('platform', $platform);
        }

        $records = $query->selectRaw('
                snapshot_date,
                SUM(impressions) as impressions,
                SUM(reach) as reach,
                SUM(engagements) as engagements,
                SUM(clicks) as clicks
            ')
            ->groupBy('snapshot_date')
            ->orderBy('snapshot_date')
            ->get()
            ->keyBy(fn ($item) => Carbon::parse($item->snapshot_date)->toDateString());

        $period = CarbonPeriod::create($startDate, $endDate);
        $series = [];

        foreach ($period as $date) {
            $dateStr = $date->toDateString();
            $rec = $records->get($dateStr);

            $impr = (int) ($rec->impressions ?? 0);
            $eng = (int) ($rec->engagements ?? 0);
            $rate = $impr > 0 ? round(($eng / $impr) * 100, 2) : 0.0;

            $series[] = [
                'date' => $dateStr,
                'day_name' => $date->format('D'),
                'impressions' => $impr,
                'reach' => (int) ($rec->reach ?? 0),
                'engagements' => $eng,
                'clicks' => (int) ($rec->clicks ?? 0),
                'engagement_rate' => $rate,
            ];
        }

        return $series;
    }

    /**
     * Compute Content Pillar ROI & Efficiency Matrix.
     */
    public function getPillarRoi(Brand $brand, Carbon $startDate, Carbon $endDate): array
    {
        $posts = PostAnalytics::where('brand_id', $brand->id)
            ->whereBetween('published_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->whereNotNull('content_pillar_id')
            ->get();

        $pillars = ContentPillar::where('brand_id', $brand->id)->get()->keyBy('id');
        $grouped = $posts->groupBy('content_pillar_id');

        $maxImpressions = 1;
        foreach ($grouped as $items) {
            $sum = $items->sum('impressions_count');
            if ($sum > $maxImpressions) {
                $maxImpressions = $sum;
            }
        }

        $results = [];

        foreach ($pillars as $pillarId => $pillar) {
            $items = $grouped->get($pillarId, collect());
            $postCount = $items->count();
            $totalImpressions = (int) $items->sum('impressions_count');
            $totalEngagements = (int) $items->sum(fn ($p) => $p->likes_count + $p->comments_count + $p->shares_count + $p->clicks_count);

            $avgEngagementRate = $totalImpressions > 0
                ? round(($totalEngagements / $totalImpressions) * 100, 2)
                : 0.0;

            // Deterministic Pillar ROI Score
            $imprFactor = ($totalImpressions / max(1, $maxImpressions)) * 100;
            $roiScore = round((0.50 * $avgEngagementRate) + (0.30 * $imprFactor) + (0.20 * $postCount), 1);

            $results[] = [
                'pillar_id' => $pillar->id,
                'pillar_name' => $pillar->name,
                'color_tag' => $pillar->color_tag ?? 'brand-primary',
                'target_percentage' => $pillar->weight_percentage,
                'post_count' => $postCount,
                'total_impressions' => $totalImpressions,
                'total_engagements' => $totalEngagements,
                'avg_engagement_rate' => $avgEngagementRate,
                'roi_score' => $roiScore,
            ];
        }

        // Sort descending by ROI score
        usort($results, fn ($a, $b) => $b['roi_score'] <=> $a['roi_score']);

        return $results;
    }

    /**
     * Compute Optimal Posting Times Heatmap (7 Days x 24 Hours).
     */
    public function getBestPostingTimes(Brand $brand): array
    {
        $posts = PostAnalytics::where('brand_id', $brand->id)->get();

        // 7 days (0=Sunday to 6=Saturday) x 24 hours
        $matrix = [];
        for ($d = 0; $d < 7; $d++) {
            $matrix[$d] = [];
            for ($h = 0; $h < 24; $h++) {
                $matrix[$d][$h] = [
                    'day' => $d,
                    'hour' => $h,
                    'engagements' => 0,
                    'post_count' => 0,
                    'score' => 0.0,
                ];
            }
        }

        $maxEngagements = 1;

        foreach ($posts as $post) {
            $day = $post->published_at->dayOfWeek;
            $hour = $post->published_at->hour;
            $eng = $post->likes_count + $post->comments_count + $post->shares_count + $post->clicks_count;

            $matrix[$day][$hour]['engagements'] += $eng;
            $matrix[$day][$hour]['post_count'] += 1;

            if ($matrix[$day][$hour]['engagements'] > $maxEngagements) {
                $maxEngagements = $matrix[$day][$hour]['engagements'];
            }
        }

        $flatSlots = [];
        $dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        for ($d = 0; $d < 7; $d++) {
            for ($h = 0; $h < 24; $h++) {
                $norm = round($matrix[$d][$h]['engagements'] / max(1, $maxEngagements), 2);
                $matrix[$d][$h]['score'] = $norm;

                $flatSlots[] = [
                    'day_name' => $dayNames[$d],
                    'day_index' => $d,
                    'hour' => $h,
                    'hour_formatted' => sprintf('%02d:00', $h),
                    'engagements' => $matrix[$d][$h]['engagements'],
                    'post_count' => $matrix[$d][$h]['post_count'],
                    'score' => $norm,
                ];
            }
        }

        // Extract top 3 recommended calendar slots
        usort($flatSlots, fn ($a, $b) => $b['score'] <=> $a['score']);
        $recommended = array_slice($flatSlots, 0, 3);

        return [
            'matrix' => $matrix,
            'recommended_slots' => $recommended,
        ];
    }

    /**
     * Fetch top performing posts ranked by engagement rate.
     */
    public function getTopPosts(Brand $brand, int $limit = 10): array
    {
        return PostAnalytics::where('brand_id', $brand->id)
            ->with([
                'contentItem:id,title,concept',
                'contentVariant:id,platform,caption',
                'contentPillar:id,name,color_tag',
            ])
            ->orderByDesc('engagement_rate')
            ->orderByDesc('impressions_count')
            ->take($limit)
            ->get()
            ->toArray();
    }
}
