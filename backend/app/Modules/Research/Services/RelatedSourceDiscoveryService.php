<?php

namespace App\Modules\Research\Services;

use App\Modules\Brand\Models\Brand;
use App\Modules\Research\Models\DiscoveredSource;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class RelatedSourceDiscoveryService
{
    /**
     * Map of industry keywords to curated high-authority seed topics and subreddits.
     */
    protected array $industrySeeds = [
        'technology' => ['techcrunch', 'hackernews', 'technology', 'artificial intelligence', 'saas'],
        'software' => ['programming', 'webdev', 'cloud computing', 'devops', 'software engineering'],
        'marketing' => ['digital marketing', 'content marketing', 'seo', 'social media', 'advertising'],
        'finance' => ['fintech', 'investing', 'venture capital', 'personal finance', 'banking'],
        'ecommerce' => ['shopify', 'retail', 'supply chain', 'direct to consumer', 'logistics'],
        'healthcare' => ['digital health', 'medtech', 'biotech', 'wellness', 'healthcare IT'],
    ];

    /**
     * Discover relevant news, community, and RSS sources tailored to a brand.
     */
    public function discoverSources(Brand $brand, array $options = []): Collection
    {
        $limit = $options['limit'] ?? 5;
        $industry = strtolower($brand->industry ?? 'technology');
        
        // Find matching seeds
        $seeds = $this->industrySeeds[$industry] ?? $this->industrySeeds['technology'];
        
        // Add brand-specific keywords from name or description
        $brandWords = array_filter(explode(' ', strtolower($brand->name)));
        $combinedTopics = array_unique(array_merge($seeds, array_slice($brandWords, 0, 2)));

        $discovered = collect();

        foreach (array_slice($combinedTopics, 0, $limit) as $topic) {
            $topicSlug = Str::slug($topic);
            $queryEncoded = urlencode($topic);

            // 1. Google News Topic Feed
            $sourceUrl = "https://news.google.com/search?q={$queryEncoded}";
            $feedUrl = "https://news.google.com/rss/search?q={$queryEncoded}&hl=en-US&gl=US&ceid=US:en";
            $sourceName = "Google News: " . ucwords($topic);

            $existing = DiscoveredSource::where('brand_id', $brand->id)
                ->where('feed_url', $feedUrl)
                ->first();

            if (!$existing) {
                $source = DiscoveredSource::create([
                    'organization_id' => $brand->organization_id,
                    'workspace_id' => $brand->workspace_id,
                    'brand_id' => $brand->id,
                    'source_type' => 'google_news',
                    'source_name' => $sourceName,
                    'source_url' => $sourceUrl,
                    'feed_url' => $feedUrl,
                    'relevance_score' => 90,
                    'authority_score' => 88,
                    'status' => 'active',
                ]);
                $discovered->push($source);
            } else {
                $discovered->push($existing);
            }

            // 2. Reddit Community Feed
            if (count($discovered) < $limit) {
                $redditUrl = "https://www.reddit.com/r/{$topicSlug}/top.json?t=day&limit=10";
                $redditName = "Reddit: r/{$topicSlug}";

                $existingReddit = DiscoveredSource::where('brand_id', $brand->id)
                    ->where('feed_url', $redditUrl)
                    ->first();

                if (!$existingReddit) {
                    $source = DiscoveredSource::create([
                        'organization_id' => $brand->organization_id,
                        'workspace_id' => $brand->workspace_id,
                        'brand_id' => $brand->id,
                        'source_type' => 'reddit',
                        'source_name' => $redditName,
                        'source_url' => "https://www.reddit.com/r/{$topicSlug}",
                        'feed_url' => $redditUrl,
                        'relevance_score' => 82,
                        'authority_score' => 75,
                        'status' => 'active',
                    ]);
                    $discovered->push($source);
                }
            }
        }

        return $discovered;
    }

    /**
     * Get active sources due for scouring.
     */
    public function getSourcesDueForScour(Brand $brand): Collection
    {
        return DiscoveredSource::where('brand_id', $brand->id)
            ->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('last_scoured_at')
                  ->orWhere('last_scoured_at', '<=', now()->subMinutes(55));
            })
            ->get();
    }
}

