<?php

namespace Tests\Feature;

use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentStrategy\Models\ContentPillar;
use App\Modules\Research\Models\ContentOpportunity;
use App\Modules\Research\Models\FeedArticle;
use App\Modules\Research\Models\RssFeed;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrendOpportunityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_can_detect_and_list_opportunities(): void
    {
        $auth = $this->createAuthenticatedTenant();

        // 1. Create a Content Pillar
        $pillar = ContentPillar::create([
            'organization_id' => $auth['org_id'],
            'workspace_id' => $auth['ws_id'],
            'brand_id' => $auth['brand_id'],
            'name' => 'Autonomous Engineering',
            'slug' => 'autonomous-engineering',
            'description' => 'Architectural leadership and deterministic systems',
            'weight_percentage' => 40,
            'status' => 'active',
        ]);

        // 2. Create Feed & Sample Article
        $feed = RssFeed::create([
            'organization_id' => $auth['org_id'],
            'workspace_id' => $auth['ws_id'],
            'brand_id' => $auth['brand_id'],
            'name' => 'Tech News',
            'url' => 'https://example.com/rss',
            'status' => 'active',
        ]);

        $article = FeedArticle::create([
            'organization_id' => $auth['org_id'],
            'workspace_id' => $auth['ws_id'],
            'rss_feed_id' => $feed->id,
            'title' => 'The Rise of Agentic Frameworks in 2026',
            'url' => 'https://example.com/rise-of-agents',
            'url_hash' => hash('sha256', 'https://example.com/rise-of-agents'),
            'summary' => 'Industry leaders report 300% efficiency gains through deterministic automation.',
            'published_at' => now(),
            'relevance_score' => 85,
        ]);

        // 3. Trigger AI Opportunity Detection
        $detectRes = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/brands/{$auth['brand_id']}/opportunities/detect", [
                'limit' => 2,
            ]);

        $detectRes->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertGreaterThan(0, count($detectRes->json('data')));

        $oppData = $detectRes->json('data.0');
        $this->assertNotEmpty($oppData['title']);
        $this->assertNotEmpty($oppData['angle']);
        $this->assertGreaterThanOrEqual(50, $oppData['overall_opportunity_score']);

        // 4. Query Opportunities List
        $listRes = $this->withHeaders($auth['headers'])
            ->getJson("/api/v1/brands/{$auth['brand_id']}/opportunities?status=new");

        $listRes->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals(count($detectRes->json('data')), count($listRes->json('data')));
    }

    public function test_can_convert_opportunity_to_draft_content_item(): void
    {
        $auth = $this->createAuthenticatedTenant();

        $pillar = ContentPillar::create([
            'organization_id' => $auth['org_id'],
            'workspace_id' => $auth['ws_id'],
            'brand_id' => $auth['brand_id'],
            'name' => 'Brand Consistency',
            'slug' => 'brand-consistency',
            'description' => 'Why brand fidelity must be maintained at scale',
            'weight_percentage' => 30,
            'status' => 'active',
        ]);

        $opportunity = ContentOpportunity::create([
            'organization_id' => $auth['org_id'],
            'workspace_id' => $auth['ws_id'],
            'brand_id' => $auth['brand_id'],
            'content_pillar_id' => $pillar->id,
            'title' => 'Autonomous Brand Scale Announcement',
            'angle' => 'Highlighting autonomous brand operations without compromising voice fidelity.',
            'why_it_matters' => 'Companies struggle with consistency as they scale cross-channel volume.',
            'recommended_channels' => ['linkedin', 'facebook', 'instagram'],
            'urgency_score' => 85,
            'freshness_score' => 90,
            'overall_opportunity_score' => 88,
            'status' => 'new',
        ]);

        // Convert Opportunity to Post
        $convertRes = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/research/opportunities/{$opportunity->id}/convert", [
                'generate_creative' => true,
            ]);

        $convertRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.opportunity.status', 'converted');

        $contentItemId = $convertRes->json('data.content_item.id');
        $this->assertNotNull($contentItemId);

        // Verify ContentItem exists in DB with multi-platform variants
        $contentItem = ContentItem::with('variants')->find($contentItemId);
        $this->assertNotNull($contentItem);
        $this->assertEquals('draft', $contentItem->status);
        $this->assertEquals(3, $contentItem->variants->count());

        // Verify Opportunity points to the converted content item
        $this->assertEquals($contentItemId, $opportunity->fresh()->converted_content_item_id);
    }

    public function test_can_dismiss_opportunity(): void
    {
        $auth = $this->createAuthenticatedTenant();

        $opportunity = ContentOpportunity::create([
            'organization_id' => $auth['org_id'],
            'workspace_id' => $auth['ws_id'],
            'brand_id' => $auth['brand_id'],
            'title' => 'Dismissable Trend',
            'angle' => 'Irrelevant angle',
            'why_it_matters' => 'Low relevance',
            'recommended_channels' => ['linkedin'],
            'status' => 'new',
        ]);

        $dismissRes = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/research/opportunities/{$opportunity->id}/dismiss");

        $dismissRes->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals('dismissed', $opportunity->fresh()->status);
    }

    public function test_tenant_isolation_on_opportunities(): void
    {
        $tenantA = $this->createAuthenticatedTenant('user_a@test.com');
        $tenantB = $this->createAuthenticatedTenant('user_b@test.com');

        $oppA = ContentOpportunity::create([
            'organization_id' => $tenantA['org_id'],
            'workspace_id' => $tenantA['ws_id'],
            'brand_id' => $tenantA['brand_id'],
            'title' => 'Tenant A Secret Strategy',
            'angle' => 'Top secret',
            'why_it_matters' => 'Confidential',
            'recommended_channels' => ['linkedin'],
            'status' => 'new',
        ]);

        // Tenant B cannot convert or dismiss Tenant A's opportunity
        $convertRes = $this->withHeaders($tenantB['headers'])
            ->postJson("/api/v1/research/opportunities/{$oppA->id}/convert");

        $this->assertContains($convertRes->status(), [403, 404]);

        $dismissRes = $this->withHeaders($tenantB['headers'])
            ->postJson("/api/v1/research/opportunities/{$oppA->id}/dismiss");

        $this->assertContains($dismissRes->status(), [403, 404]);
    }

    protected function createAuthenticatedTenant(string $email = 'trenduser@test.com'): array
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Trend Setter',
            'email' => $email,
            'password' => 'secret123',
            'organization_name' => 'Trend Corp',
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
                'name' => 'Omni Trend Brand',
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

