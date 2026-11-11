<?php

namespace App\Modules\Research\Services;

use App\AI\Gateway\AIGateway;
use App\Modules\Brand\Models\Brand;
use App\Modules\Research\Models\CompetitorPost;
use App\Modules\Research\Models\CompetitorProfile;

class CompetitorTrackerService
{
    public function __construct(
        protected AIGateway $aiGateway
    ) {}

    /**
     * Register a new competitor profile under a brand.
     */
    public function createCompetitor(Brand $brand, array $data): CompetitorProfile
    {
        return CompetitorProfile::create([
            'organization_id' => $brand->organization_id,
            'workspace_id' => $brand->workspace_id,
            'brand_id' => $brand->id,
            'name' => $data['name'],
            'website_url' => $data['website_url'] ?? null,
            'social_handles' => $data['social_handles'] ?? [],
            'strengths' => $data['strengths'] ?? null,
            'weaknesses' => $data['weaknesses'] ?? null,
            'target_audience' => $data['target_audience'] ?? null,
            'observation_frequency' => $data['observation_frequency'] ?? 'weekly',
            'status' => 'active',
        ]);
    }

    /**
     * Update an existing competitor profile.
     */
    public function updateCompetitor(CompetitorProfile $profile, array $data): CompetitorProfile
    {
        $profile->update(array_filter([
            'name' => $data['name'] ?? null,
            'website_url' => $data['website_url'] ?? null,
            'social_handles' => $data['social_handles'] ?? null,
            'strengths' => $data['strengths'] ?? null,
            'weaknesses' => $data['weaknesses'] ?? null,
            'target_audience' => $data['target_audience'] ?? null,
            'observation_frequency' => $data['observation_frequency'] ?? null,
            'status' => $data['status'] ?? null,
        ], fn ($val) => ! is_null($val)));

        return $profile;
    }

    /**
     * Log an observed social post by a competitor.
     */
    public function logPost(CompetitorProfile $profile, array $data): CompetitorPost
    {
        return CompetitorPost::create([
            'organization_id' => $profile->organization_id,
            'workspace_id' => $profile->workspace_id,
            'competitor_profile_id' => $profile->id,
            'platform' => $data['platform'] ?? 'linkedin',
            'post_url' => $data['post_url'] ?? null,
            'post_text' => $data['post_text'],
            'published_at' => $data['published_at'] ?? now(),
            'engagement_signals' => $data['engagement_signals'] ?? ['likes' => 0, 'comments' => 0, 'shares' => 0],
            'observed_themes' => $data['observed_themes'] ?? ['general_update'],
            'tone' => $data['tone'] ?? 'professional',
            'tactical_takeaway' => $data['tactical_takeaway'] ?? null,
        ]);
    }

    /**
     * Aggregate tactical insights, cadence, and theme breakdown for all brand competitors.
     */
    public function getInsights(Brand $brand): array
    {
        $competitorIds = CompetitorProfile::where('brand_id', $brand->id)->pluck('id');
        $posts = CompetitorPost::whereIn('competitor_profile_id', $competitorIds)->get();

        $themeCounts = [];
        $platformCounts = [];
        $totalEngagements = 0;

        foreach ($posts as $post) {
            $themes = $post->observed_themes ?: [];
            foreach ($themes as $theme) {
                $themeCounts[$theme] = ($themeCounts[$theme] ?? 0) + 1;
            }

            $platform = $post->platform;
            $platformCounts[$platform] = ($platformCounts[$platform] ?? 0) + 1;

            $signals = $post->engagement_signals ?: [];
            $totalEngagements += ($signals['likes'] ?? 0) + ($signals['comments'] ?? 0) + ($signals['shares'] ?? 0);
        }

        arsort($themeCounts);
        $topThemes = [];
        foreach (array_slice($themeCounts, 0, 8, true) as $theme => $count) {
            $topThemes[] = ['theme' => $theme, 'count' => $count];
        }

        $competitorCount = $competitorIds->count();
        $totalPosts = $posts->count();
        $avgPostsPerWeek = $competitorCount > 0 ? round(($totalPosts / max(1, $competitorCount)) / 4, 1) : 0;

        return [
            'total_competitors' => $competitorCount,
            'total_posts_observed' => $totalPosts,
            'avg_posts_per_week' => $avgPostsPerWeek,
            'total_engagements_observed' => $totalEngagements,
            'top_themes' => $topThemes,
            'platform_distribution' => $platformCounts,
        ];
    }

    /**
     * Identify strategic gaps and market whitespace where competitors are inactive.
     */
    public function analyzeCompetitorGaps(Brand $brand): array
    {
        $insights = $this->getInsights($brand);
        $competitorThemes = array_column($insights['top_themes'] ?? [], 'theme');
        $competitorThemeSet = array_map(function ($t) {
            return strtolower(str_replace(['_', '-'], ' ', $t));
        }, $competitorThemes);

        $pillars = $brand->contentPillars()->where('status', 'active')->get();
        $gaps = [];

        foreach ($pillars as $pillar) {
            $normalizedPillar = strtolower(str_replace(['_', '-'], ' ', $pillar->name));
            $isCoveredByCompetitor = false;
            foreach ($competitorThemeSet as $theme) {
                if (stripos($normalizedPillar, $theme) !== false || stripos($theme, $normalizedPillar) !== false) {
                    $isCoveredByCompetitor = true;
                    break;
                }
            }

            if (!$isCoveredByCompetitor) {
                $gaps[] = [
                    'pillar_id' => $pillar->id,
                    'pillar_name' => $pillar->name,
                    'strategic_advantage' => 'Competitors have zero observed activity in this theme. High differentiation opportunity.',
                    'recommended_action' => 'Prioritize thought leadership campaigns addressing ' . $pillar->name,
                ];
            }
        }

        return [
            'brand_id' => $brand->id,
            'total_gaps_identified' => count($gaps),
            'whitespace_opportunities' => $gaps,
            'competitor_saturated_themes' => $insights['top_themes'],
        ];
    }
}

