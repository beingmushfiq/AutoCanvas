<?php

namespace App\Modules\Research\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\Research\Models\FeedArticle;
use App\Modules\Research\Models\RssFeed;
use App\Modules\Research\Services\RssIngestionService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RssFeedController extends Controller
{
    /**
     * List all RSS feeds for a brand.
     */
    public function index(Request $request, string $brandId): JsonResponse
    {
        $brand = Brand::findOrFail($brandId);

        $feeds = RssFeed::where('brand_id', $brand->id)
            ->withCount('articles')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $feeds,
        ]);
    }

    /**
     * Register a new RSS feed.
     */
    public function store(Request $request, string $brandId, RssIngestionService $service): JsonResponse
    {
        $brand = Brand::findOrFail($brandId);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'url' => 'required|url|max:500',
            'category' => 'nullable|string|max:100',
            'fetch_frequency_minutes' => 'nullable|integer|min:15|max:1440',
        ]);

        $feed = $service->createFeed($brand, $validated);

        return response()->json([
            'success' => true,
            'message' => 'RSS feed registered successfully.',
            'data' => $feed,
        ], 201);
    }

    /**
     * Trigger immediate manual sync for a feed.
     */
    public function sync(string $feedId, RssIngestionService $service): JsonResponse
    {
        $feed = RssFeed::findOrFail($feedId);

        try {
            $inserted = $service->syncFeed($feed);

            return response()->json([
                'success' => true,
                'message' => "Feed synchronized. Ingested {$inserted} new articles.",
                'data' => [
                    'feed' => $feed->fresh(),
                    'new_articles_count' => $inserted,
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Sync failed: {$e->getMessage()}",
                'data' => [
                    'feed' => $feed->fresh(),
                ],
            ], 422);
        }
    }

    /**
     * Remove / delete an RSS feed.
     */
    public function destroy(string $feedId): JsonResponse
    {
        $feed = RssFeed::findOrFail($feedId);
        $feed->delete();

        return response()->json([
            'success' => true,
            'message' => 'RSS feed deleted successfully.',
        ]);
    }

    /**
     * List paginated articles for a brand's feeds.
     */
    public function articles(Request $request, string $brandId): JsonResponse
    {
        $brand = Brand::findOrFail($brandId);
        $feedIds = RssFeed::where('brand_id', $brand->id)->pluck('id');

        $query = FeedArticle::whereIn('rss_feed_id', $feedIds)
            ->with('feed:id,name,category')
            ->orderBy('published_at', 'desc');

        if ($request->filled('feed_id')) {
            $query->where('rss_feed_id', $request->query('feed_id'));
        }

        if ($request->boolean('saved_only')) {
            $query->where('is_saved', true);
        }

        if ($request->filled('search')) {
            $term = '%'.$request->query('search').'%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                    ->orWhere('summary', 'like', $term);
            });
        }

        $articles = $query->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $articles->items(),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'total' => $articles->total(),
            ],
        ]);
    }

    /**
     * Toggle bookmark/saved status on an article.
     */
    public function toggleSaveArticle(string $articleId): JsonResponse
    {
        $article = FeedArticle::findOrFail($articleId);
        $article->update(['is_saved' => ! $article->is_saved]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $article->id,
                'is_saved' => $article->is_saved,
            ],
        ]);
    }
}
