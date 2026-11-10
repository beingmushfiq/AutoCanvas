<?php

namespace App\Modules\Research\Services;

use App\Core\Security\UrlSafetyValidator;
use App\Modules\Brand\Models\Brand;
use App\Modules\Research\Models\FeedArticle;
use App\Modules\Research\Models\RssFeed;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Http;
use SimpleXMLElement;

class RssIngestionService
{
    /**
     * Create a new RSS feed subscription for a brand.
     */
    public function createFeed(Brand $brand, array $data): RssFeed
    {
        $url = trim($data['url']);
        UrlSafetyValidator::assertSafeUrl($url);

        return RssFeed::create([
            'organization_id' => $brand->organization_id,
            'workspace_id' => $brand->workspace_id,
            'brand_id' => $brand->id,
            'name' => $data['name'] ?? parse_url($url, PHP_URL_HOST),
            'url' => $url,
            'category' => $data['category'] ?? 'industry_news',
            'fetch_frequency_minutes' => $data['fetch_frequency_minutes'] ?? 60,
            'status' => 'active',
        ]);
    }

    /**
     * Fetch and ingest latest articles from an RSS feed with deduplication.
     */
    public function syncFeed(RssFeed $feed): int
    {
        UrlSafetyValidator::assertSafeUrl($feed->url);

        try {
            $request = Http::timeout(10)
                ->withUserAgent('AutoCanvas-ResearchBot/1.0 (+https://autocanvas.io)');

            if ($feed->etag) {
                $request->withHeaders(['If-None-Match' => $feed->etag]);
            }
            if ($feed->last_modified_header) {
                $request->withHeaders(['If-Modified-Since' => $feed->last_modified_header]);
            }

            $response = $request->get($feed->url);

            if ($response->status() === 304) {
                // Not modified since last fetch
                $feed->update(['last_fetched_at' => now(), 'error_count' => 0, 'last_error' => null]);

                return 0;
            }

            if (! $response->successful()) {
                throw new Exception("HTTP request failed with status code: {$response->status()}");
            }

            $rawBody = $response->body();
            $items = $this->parseXmlItems($rawBody);

            $insertedCount = 0;
            foreach ($items as $item) {
                $urlHash = hash('sha256', $item['url']);

                $exists = FeedArticle::where('workspace_id', $feed->workspace_id)
                    ->where('url_hash', $urlHash)
                    ->exists();

                if ($exists) {
                    continue;
                }

                FeedArticle::create([
                    'organization_id' => $feed->organization_id,
                    'workspace_id' => $feed->workspace_id,
                    'rss_feed_id' => $feed->id,
                    'title' => $item['title'],
                    'url' => $item['url'],
                    'url_hash' => $urlHash,
                    'author' => $item['author'] ?? null,
                    'summary' => $item['summary'] ?? null,
                    'content' => $item['content'] ?? null,
                    'published_at' => $item['published_at'] ?? now(),
                    'relevance_score' => $this->calculateRelevance($item, $feed),
                    'topics' => $item['topics'] ?? [],
                    'is_saved' => false,
                ]);

                $insertedCount++;
            }

            $feed->update([
                'last_fetched_at' => now(),
                'status' => 'active',
                'error_count' => 0,
                'last_error' => null,
                'etag' => $response->header('ETag'),
                'last_modified_header' => $response->header('Last-Modified'),
            ]);

            return $insertedCount;
        } catch (Exception $e) {
            $newErrorCount = $feed->error_count + 1;
            $feed->update([
                'error_count' => $newErrorCount,
                'last_error' => $e->getMessage(),
                'status' => $newErrorCount >= 5 ? 'failing' : $feed->status,
            ]);

            throw $e;
        }
    }

    /**
     * Parse XML string supporting both RSS 2.0 and Atom formats cleanly.
     * Prevents XXE injection via LIBXML_NONET.
     */
    public function parseXmlItems(string $xmlContent): array
    {
        $cleanXml = trim($xmlContent);
        if (empty($cleanXml)) {
            return [];
        }

        // XXE Safe parsing with LIBXML_NONET
        $xml = @simplexml_load_string($cleanXml, SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
        if (! $xml) {
            return [];
        }

        $parsed = [];

        // RSS 2.0 / RSS 0.92
        if (isset($xml->channel->item)) {
            foreach ($xml->channel->item as $item) {
                $title = trim((string) $item->title);
                $link = trim((string) $item->link);
                $description = trim((string) $item->description);

                // Check for content:encoded namespace if available
                $content = $description;
                $contentNs = $item->children('http://purl.org/rss/1.0/modules/content/');
                if (isset($contentNs->encoded)) {
                    $content = (string) $contentNs->encoded;
                }

                $pubDate = null;
                if (! empty($item->pubDate)) {
                    try {
                        $pubDate = Carbon::parse((string) $item->pubDate);
                    } catch (Exception) {
                        $pubDate = now();
                    }
                }

                $author = (string) ($item->author ?? $item->children('dc', true)->creator ?? '');

                $topics = [];
                if (isset($item->category)) {
                    foreach ($item->category as $cat) {
                        $topics[] = trim((string) $cat);
                    }
                }

                if (! empty($link) && ! empty($title)) {
                    $parsed[] = [
                        'title' => html_entity_decode(strip_tags($title)),
                        'url' => $link,
                        'summary' => html_entity_decode(strip_tags($description)),
                        'content' => html_entity_decode(strip_tags($content)),
                        'published_at' => $pubDate,
                        'author' => $author ?: null,
                        'topics' => array_values(array_filter($topics)),
                    ];
                }
            }
        } // Atom format (<feed><entry>)
        elseif (isset($xml->entry)) {
            foreach ($xml->entry as $entry) {
                $title = trim((string) $entry->title);

                $link = '';
                if (isset($entry->link)) {
                    foreach ($entry->link as $linkEl) {
                        $rel = (string) $linkEl['rel'];
                        if ($rel === 'alternate' || empty($rel)) {
                            $link = (string) $linkEl['href'];
                            break;
                        }
                    }
                    if (empty($link)) {
                        $link = (string) $entry->link['href'];
                    }
                }

                $summary = trim((string) ($entry->summary ?? $entry->content ?? ''));
                $content = trim((string) ($entry->content ?? $entry->summary ?? ''));

                $pubDate = null;
                $dateStr = (string) ($entry->published ?? $entry->updated ?? '');
                if (! empty($dateStr)) {
                    try {
                        $pubDate = Carbon::parse($dateStr);
                    } catch (Exception) {
                        $pubDate = now();
                    }
                }

                $author = (string) ($entry->author->name ?? '');

                $topics = [];
                if (isset($entry->category)) {
                    foreach ($entry->category as $cat) {
                        $term = (string) ($cat['term'] ?? $cat['label'] ?? '');
                        if ($term) {
                            $topics[] = trim($term);
                        }
                    }
                }

                if (! empty($link) && ! empty($title)) {
                    $parsed[] = [
                        'title' => html_entity_decode(strip_tags($title)),
                        'url' => $link,
                        'summary' => html_entity_decode(strip_tags($summary)),
                        'content' => html_entity_decode(strip_tags($content)),
                        'published_at' => $pubDate,
                        'author' => $author ?: null,
                        'topics' => array_values(array_filter($topics)),
                    ];
                }
            }
        }

        return $parsed;
    }

    /**
     * Compute a relevance score (0-100) based on industry keyword match.
     */
    protected function calculateRelevance(array $item, RssFeed $feed): int
    {
        $score = 65; // Base relevance
        $text = strtolower($item['title'].' '.($item['summary'] ?? ''));

        if ($feed->brand) {
            $industry = strtolower($feed->brand->industry ?? '');
            if ($industry && str_contains($text, $industry)) {
                $score += 20;
            }

            foreach ($feed->brand->contentPillars as $pillar) {
                if (str_contains($text, strtolower($pillar->name))) {
                    $score += 15;
                    break;
                }
            }
        }

        return min(100, $score);
    }

    /**
     * Batch sync all feeds that are due for updating.
     */
    public function syncDueFeeds(int $limit = 20): int
    {
        $feeds = RssFeed::where('status', '!=', 'paused')
            ->get()
            ->filter(function (RssFeed $feed) {
                if (! $feed->last_fetched_at) {
                    return true;
                }

                return $feed->last_fetched_at->diffInMinutes(now()) >= $feed->fetch_frequency_minutes;
            })
            ->take($limit);

        $totalInserted = 0;
        foreach ($feeds as $feed) {
            try {
                $totalInserted += $this->syncFeed($feed);
            } catch (Exception) {
                // Log and continue to next feed
                continue;
            }
        }

        return $totalInserted;
    }
}
