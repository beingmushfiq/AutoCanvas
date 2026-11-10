<?php

namespace Tests\Feature;

use App\Modules\Research\Models\FeedArticle;
use App\Modules\Research\Models\RssFeed;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RssIngestionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_can_register_and_list_rss_feed(): void
    {
        $auth = $this->createAuthenticatedTenant();

        $createRes = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/brands/{$auth['brand_id']}/feeds", [
                'name' => 'TechCrunch Disrupt',
                'url' => 'https://techcrunch.com/feed/',
                'category' => 'technology',
                'fetch_frequency_minutes' => 30,
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'TechCrunch Disrupt')
            ->assertJsonPath('data.category', 'technology')
            ->assertJsonPath('data.status', 'active');

        $listRes = $this->withHeaders($auth['headers'])
            ->getJson("/api/v1/brands/{$auth['brand_id']}/feeds");

        $listRes->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_ssrf_validator_blocks_internal_and_metadata_urls(): void
    {
        $auth = $this->createAuthenticatedTenant();

        // 1. Loopback localhost
        $res1 = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/brands/{$auth['brand_id']}/feeds", [
                'name' => 'Internal Test',
                'url' => 'http://127.0.0.1:8000/feed.xml',
            ]);
        $res1->assertStatus(422)
            ->assertJsonValidationErrors('url');

        // 2. AWS / Cloud Metadata IP
        $res2 = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/brands/{$auth['brand_id']}/feeds", [
                'name' => 'Metadata Theft Attempt',
                'url' => 'http://169.254.169.254/latest/meta-data',
            ]);
        $res2->assertStatus(422)
            ->assertJsonValidationErrors('url');

        // 3. Localhost hostname
        $res3 = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/brands/{$auth['brand_id']}/feeds", [
                'name' => 'Localhost Attempt',
                'url' => 'http://localhost/rss',
            ]);
        $res3->assertStatus(422)
            ->assertJsonValidationErrors('url');
    }

    public function test_can_ingest_rss_2_xml_and_deduplicate_articles(): void
    {
        $auth = $this->createAuthenticatedTenant();

        $rssXml = <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>SaaS Trends</title>
    <link>https://example.com/saas</link>
    <description>Latest trends in enterprise SaaS</description>
    <item>
      <title>Autonomous Workflow Orchestration in 2026</title>
      <link>https://example.com/saas/autonomous-workflows-2026</link>
      <description>How agentic platforms are changing social media operations.</description>
      <pubDate>Tue, 10 Nov 2026 12:00:00 GMT</pubDate>
      <author>editor@example.com</author>
      <category>AI</category>
      <category>Operations</category>
    </item>
    <item>
      <title>Deterministic Rendering vs AI Typography</title>
      <link>https://example.com/saas/deterministic-rendering</link>
      <description>Why brand consistency demands programmatic layout engines.</description>
      <pubDate>Tue, 10 Nov 2026 14:00:00 GMT</pubDate>
      <category>Design</category>
    </item>
  </channel>
</rss>
XML;

        Http::fake([
            'https://saastrends.com/feed.xml' => Http::response($rssXml, 200, ['ETag' => '"etag-100"']),
        ]);

        $feed = RssFeed::create([
            'organization_id' => $auth['org_id'],
            'workspace_id' => $auth['ws_id'],
            'brand_id' => $auth['brand_id'],
            'name' => 'SaaS Trends',
            'url' => 'https://saastrends.com/feed.xml',
            'status' => 'active',
        ]);

        // 1. Sync Feed
        $syncRes = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/research/feeds/{$feed->id}/sync");

        $syncRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.new_articles_count', 2);

        $this->assertEquals(2, FeedArticle::where('rss_feed_id', $feed->id)->count());

        // 2. Re-sync identical XML — deduplication must result in 0 new articles
        $resyncRes = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/research/feeds/{$feed->id}/sync");

        $resyncRes->assertStatus(200)
            ->assertJsonPath('data.new_articles_count', 0);

        $this->assertEquals(2, FeedArticle::where('rss_feed_id', $feed->id)->count());

        // 3. Verify Article Query
        $articlesRes = $this->withHeaders($auth['headers'])
            ->getJson("/api/v1/brands/{$auth['brand_id']}/articles?search=Deterministic");

        $articlesRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Deterministic Rendering vs AI Typography');
    }

    public function test_can_ingest_atom_feed_and_toggle_save_status(): void
    {
        $auth = $this->createAuthenticatedTenant();

        $atomXml = <<<'XML'
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Developer News</title>
  <link href="https://example.com/dev/feed" rel="self"/>
  <updated>2026-11-10T15:00:00Z</updated>
  <entry>
    <title>Scaling Microservices with Laravel and Redis</title>
    <link href="https://example.com/dev/scaling-laravel-redis" rel="alternate"/>
    <summary>Practical patterns for asynchronous workers.</summary>
    <published>2026-11-10T14:30:00Z</published>
    <author><name>Alex Rivera</name></author>
    <category term="Backend"/>
  </entry>
</feed>
XML;

        Http::fake([
            'https://example.com/dev/atom.xml' => Http::response($atomXml, 200),
        ]);

        $feed = RssFeed::create([
            'organization_id' => $auth['org_id'],
            'workspace_id' => $auth['ws_id'],
            'brand_id' => $auth['brand_id'],
            'name' => 'Dev News',
            'url' => 'https://example.com/dev/atom.xml',
            'status' => 'active',
        ]);

        $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/research/feeds/{$feed->id}/sync")
            ->assertStatus(200)
            ->assertJsonPath('data.new_articles_count', 1);

        $article = FeedArticle::where('rss_feed_id', $feed->id)->first();
        $this->assertNotNull($article);
        $this->assertFalse($article->is_saved);

        // Toggle Save
        $toggleRes = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/research/articles/{$article->id}/toggle-save");

        $toggleRes->assertStatus(200)
            ->assertJsonPath('data.is_saved', true);

        $this->assertTrue($article->fresh()->is_saved);
    }

    public function test_tenant_isolation_on_feeds(): void
    {
        $tenantA = $this->createAuthenticatedTenant('org_a@test.com');
        $tenantB = $this->createAuthenticatedTenant('org_b@test.com');

        $feedA = RssFeed::create([
            'organization_id' => $tenantA['org_id'],
            'workspace_id' => $tenantA['ws_id'],
            'brand_id' => $tenantA['brand_id'],
            'name' => 'Tenant A Private Feed',
            'url' => 'https://example.com/tenanta/feed.xml',
            'status' => 'active',
        ]);

        // Tenant B cannot sync or delete Tenant A's feed (blocked by 403 or 404)
        $syncRes = $this->withHeaders($tenantB['headers'])
            ->postJson("/api/v1/research/feeds/{$feedA->id}/sync");

        $this->assertContains($syncRes->status(), [403, 404]);

        $deleteRes = $this->withHeaders($tenantB['headers'])
            ->deleteJson("/api/v1/research/feeds/{$feedA->id}");

        $this->assertContains($deleteRes->status(), [403, 404]);
    }

    protected function createAuthenticatedTenant(string $email = 'researcher@test.com'): array
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Researcher',
            'email' => $email,
            'password' => 'secret123',
            'organization_name' => 'Research Org',
        ]);

        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');
        $orgId = $reg->json('data.organization.id');

        $headers = [
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ];

        $brandId = $this->withHeaders($headers)
            ->postJson('/api/v1/brands', [
                'name' => 'Apex Research Brand',
                'industry' => 'Technology',
            ])->json('data.id');

        return [
            'token' => $token,
            'ws_id' => $wsId,
            'org_id' => $orgId,
            'brand_id' => $brandId,
            'headers' => $headers,
        ];
    }
}
