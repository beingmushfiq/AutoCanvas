<?php

namespace App\Modules\Research\Services;

use App\AI\Gateway\AIGateway;
use App\Models\User;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentProduction\Services\ContentGenerationService;
use App\Modules\Organization\Services\AuditLogger;
use App\Modules\Research\Models\ContentOpportunity;
use App\Modules\Research\Models\FeedArticle;
use App\Modules\Research\Models\RssFeed;
use Illuminate\Support\Collection;

class TrendAnalysisService
{
    public function __construct(
        protected AIGateway $aiGateway,
        protected ContentGenerationService $contentGenService,
        protected CompetitorTrackerService $competitorService
    ) {}

    /**
     * Scan fresh feeds and competitor signals to generate ranked Content Opportunities.
     */
    public function detectOpportunities(Brand $brand, array $options = []): Collection
    {
        $limit = $options['limit'] ?? 5;

        // 1. Collect recent feed articles for this brand or workspace
        $feedIds = RssFeed::where('brand_id', $brand->id)->pluck('id');
        $recentArticles = FeedArticle::whereIn('rss_feed_id', $feedIds)
            ->latest()
            ->take(10)
            ->get();

        // 2. Collect competitor themes
        $insights = $this->competitorService->getInsights($brand);
        $topThemes = array_column($insights['top_themes'] ?? [], 'theme');

        // 3. Format Brand Pillars Context
        $pillars = $brand->contentPillars()->where('status', 'active')->get();
        $pillarList = '';
        foreach ($pillars as $p) {
            $pillarList .= "- [ID: {$p->id}] {$p->name} ({$p->weight_percentage}% weight): {$p->description}\n";
        }

        $articleList = '';
        foreach ($recentArticles as $art) {
            $articleList .= "- [ID: {$art->id}] Title: \"{$art->title}\" (Summary: {$art->summary})\n";
        }

        $themesStr = implode(', ', $topThemes) ?: 'None logged yet';

        // 4. Formulate Prompt
        $prompt = <<<PROMPT
You are an autonomous Social Media Content Strategist and Industry Trend Researcher.
Analyze the following industry news, competitor themes, and brand content pillars to generate high-urgency, on-brand content opportunities.

Brand: {$brand->name}
Industry: {$brand->industry}
Mission: {$brand->profile?->mission}

Brand Content Pillars:
{$pillarList}

Recent Industry Articles:
{$articleList}

Observed Competitor Themes:
{$themesStr}

Generate {$limit} high-value content opportunities. Each opportunity must pair an industry signal or competitor gap with one of the brand's active content pillars.

Return a JSON object matching this schema:
{
  "opportunities": [
    {
      "title": "Clear headline for the post concept",
      "angle": "Strategic angle explaining our unique brand perspective",
      "why_it_matters": "Why this topic is urgent/relevant right now",
      "content_pillar_id": "Pillar ID from above list, or null",
      "feed_article_id": "Article ID from above list, or null",
      "recommended_channels": ["linkedin", "facebook", "instagram"],
      "urgency_score": 85,
      "freshness_score": 90,
      "overall_opportunity_score": 88
    }
  ]
}
PROMPT;

        $aiResult = $this->aiGateway->generateText($prompt, [
            'task_type' => 'opportunity_detection',
            'brand_id' => $brand->id,
            'organization_id' => $brand->organization_id,
        ]);

        $decoded = json_decode($aiResult['text'], true) ?: [];
        $rawOpps = $decoded['opportunities'] ?? [];

        $savedOpportunities = collect();
        $recommendedPillar = app(\App\Modules\ContentStrategy\Services\ContentPillarService::class)->getRecommendedPillar($brand);
        $defaultPillarId = $recommendedPillar?->id ?? $pillars->first()?->id;

        foreach ($rawOpps as $opp) {
            $pillarId = ! empty($opp['content_pillar_id']) && $pillars->contains('id', $opp['content_pillar_id'])
                ? $opp['content_pillar_id']
                : $defaultPillarId;

            $articleId = ! empty($opp['feed_article_id']) && $recentArticles->contains('id', $opp['feed_article_id'])
                ? $opp['feed_article_id']
                : $recentArticles->first()?->id;

            $urgency = (int) ($opp['urgency_score'] ?? 75);
            $freshness = (int) ($opp['freshness_score'] ?? 80);
            $brandFit = (int) ($opp['brand_fit_score'] ?? 85);
            $overall = (int) ($opp['overall_opportunity_score'] ?? $this->calculateOpportunityScore($freshness, $brandFit, $urgency));

            $opportunity = ContentOpportunity::create([
                'organization_id' => $brand->organization_id,
                'workspace_id' => $brand->workspace_id,
                'brand_id' => $brand->id,
                'content_pillar_id' => $pillarId,
                'feed_article_id' => $articleId,
                'title' => $opp['title'],
                'angle' => $opp['angle'],
                'why_it_matters' => $opp['why_it_matters'],
                'recommended_channels' => $opp['recommended_channels'] ?? ['linkedin', 'facebook', 'instagram'],
                'urgency_score' => $urgency,
                'freshness_score' => $freshness,
                'overall_opportunity_score' => $overall,
                'status' => 'new',
            ]);

            $savedOpportunities->push($opportunity);
        }

        return $savedOpportunities;
    }

    /**
     * Compute multi-factor opportunity score:
     * 35% Freshness + 35% Brand Fit + 30% Audience Urgency
     */
    public function calculateOpportunityScore(int $freshness, int $brandFit, int $urgency): int
    {
        $freshness = max(0, min(100, $freshness));
        $brandFit = max(0, min(100, $brandFit));
        $urgency = max(0, min(100, $urgency));

        return (int) round((0.35 * $freshness) + (0.35 * $brandFit) + (0.30 * $urgency));
    }

    /**
     * Convert an Opportunity directly into a drafted ContentItem with multi-channel variants.
     */
    public function convertOpportunityToPost(ContentOpportunity $opportunity, User $user, array $overrides = []): ContentItem
    {
        $brand = $opportunity->brand;

        $topic = "Opportunity: {$opportunity->title}. Angle: {$opportunity->angle}. Why it matters: {$opportunity->why_it_matters}";

        $options = [
            'content_pillar_id' => $opportunity->content_pillar_id,
            'topic' => $topic,
            'platforms' => $overrides['platforms'] ?? $opportunity->recommended_channels ?? ['linkedin', 'facebook', 'instagram'],
            'generate_creative' => $overrides['generate_creative'] ?? true,
            'use_knowledge' => $overrides['use_knowledge'] ?? true,
        ];

        // 1. Generate full multi-platform post and creative
        $contentItem = $this->contentGenService->generate($brand, $options, $user);

        // 2. Attach source context to the newly created content item
        $contentItem->update([
            'source_context' => [
                'type' => 'content_opportunity',
                'opportunity_id' => $opportunity->id,
                'feed_article_id' => $opportunity->feed_article_id,
                'angle' => $opportunity->angle,
                'why_it_matters' => $opportunity->why_it_matters,
            ],
        ]);

        // 3. Mark opportunity as converted
        $opportunity->update([
            'status' => 'converted',
            'converted_content_item_id' => $contentItem->id,
        ]);

        // 4. Audit Log
        AuditLogger::log(
            action: 'research.opportunity_converted',
            auditable: $opportunity,
            oldValues: null,
            newValues: [
                'content_item_id' => $contentItem->id,
                'title' => $opportunity->title,
            ],
            organizationId: $opportunity->organization_id,
            workspaceId: $opportunity->workspace_id
        );

        return $contentItem;
    }

    /**
     * Dismiss an opportunity from the radar.
     */
    public function dismissOpportunity(ContentOpportunity $opportunity): void
    {
        $opportunity->update(['status' => 'dismissed']);
    }
}
