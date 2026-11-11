<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentStrategy\Models\ContentPillar;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Research\Models\CompetitorPost;
use App\Modules\Research\Models\CompetitorProfile;
use App\Modules\Research\Models\ContentOpportunity;
use App\Modules\Research\Models\FeedArticle;
use App\Modules\Research\Models\RssFeed;
use App\Modules\Research\Services\TrendAnalysisService;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Carbon\Carbon;
use Database\Seeders\ControlPlaneSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ResearchIntelligenceTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $orgA;
    protected Workspace $workspaceA;
    protected User $userA;
    protected string $tokenA;
    protected Brand $brandA;

    protected Organization $orgB;
    protected Workspace $workspaceB;
    protected User $userB;
    protected string $tokenB;
    protected Brand $brandB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        $this->seed(RbacSeeder::class);
        $this->seed(ControlPlaneSeeder::class);
        Storage::fake('public');

        // Setup Tenant A
        $this->orgA = Organization::create([
            'name' => 'Intelligence Agency A',
            'slug' => 'intel-agency-a',
            'billing_email' => 'admin@intela.com',
        ]);
        $this->workspaceA = Workspace::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Main Workspace A',
            'slug' => 'ws-a',
        ]);
        $this->userA = User::create([
            'name' => 'Researcher Alice',
            'email' => 'alice@intela.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $this->orgA->id,
            'current_workspace_id' => $this->workspaceA->id,
            'status' => 'active',
        ]);
        OrganizationMember::create([
            'organization_id' => $this->orgA->id,
            'user_id' => $this->userA->id,
            'role' => 'owner',
        ]);
        WorkspaceMember::create([
            'workspace_id' => $this->workspaceA->id,
            'user_id' => $this->userA->id,
            'role' => 'admin',
        ]);
        $this->userA->assignRole('org_owner', $this->orgA->id);
        $this->tokenA = $this->userA->createToken('token_a')->plainTextToken;

        $this->brandA = Brand::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Apex Tech A',
            'slug' => 'apex-tech-a',
            'status' => 'active',
        ]);

        // Setup Tenant B
        $this->orgB = Organization::create([
            'name' => 'Intelligence Agency B',
            'slug' => 'intel-agency-b',
            'billing_email' => 'admin@intelb.com',
        ]);
        $this->workspaceB = Workspace::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Main Workspace B',
            'slug' => 'ws-b',
        ]);
        $this->userB = User::create([
            'name' => 'Researcher Bob',
            'email' => 'bob@intelb.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $this->orgB->id,
            'current_workspace_id' => $this->workspaceB->id,
            'status' => 'active',
        ]);
        OrganizationMember::create([
            'organization_id' => $this->orgB->id,
            'user_id' => $this->userB->id,
            'role' => 'owner',
        ]);
        WorkspaceMember::create([
            'workspace_id' => $this->workspaceB->id,
            'user_id' => $this->userB->id,
            'role' => 'admin',
        ]);
        $this->userB->assignRole('org_owner', $this->orgB->id);
        $this->tokenB = $this->userB->createToken('token_b')->plainTextToken;

        $this->brandB = Brand::create([
            'organization_id' => $this->orgB->id,
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Apex Tech B',
            'slug' => 'apex-tech-b',
            'status' => 'active',
        ]);
    }

    public function test_rss_feed_sync_ingests_and_deduplicates_articles(): void
    {
        $feed = RssFeed::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Tech Radar Feed',
            'url' => 'https://example.com/rss.xml',
            'status' => 'active',
        ]);

        $mockXml = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tech Radar</title>
    <link>https://example.com</link>
    <item>
      <title>Autonomous Cloud Agents in 2026</title>
      <link>https://example.com/article-1</link>
      <description>Breakthrough in deterministic agent orchestration.</description>
      <pubDate>Wed, 11 Nov 2026 00:00:00 +0000</pubDate>
    </item>
    <item>
      <title>Scaling Microservices with Zero Memory Leaks</title>
      <link>https://example.com/article-2</link>
      <description>Best practices for resilient cloud architectures.</description>
      <pubDate>Wed, 11 Nov 2026 01:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>
XML;

        Http::fake([
            'https://example.com/rss.xml' => Http::response($mockXml, 200, [
                'Content-Type' => 'application/xml',
            ]),
        ]);

        // First Sync
        $syncRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/research/feeds/{$feed->id}/sync");

        $syncRes->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals(2, FeedArticle::where('rss_feed_id', $feed->id)->count());

        // Second Sync with identical articles -> Must deduplicate
        $syncRes2 = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/research/feeds/{$feed->id}/sync");

        $syncRes2->assertStatus(200);

        // Count must still be 2 (zero duplicates)
        $this->assertEquals(2, FeedArticle::where('rss_feed_id', $feed->id)->count());
    }

    public function test_competitor_profile_and_post_logging_enforces_tenant_scoping(): void
    {
        $comp = CompetitorProfile::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Market Rival Inc',
            'website_url' => 'https://rival.com',
            'status' => 'active',
        ]);

        // Log a competitor post
        $postRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/research/competitors/{$comp->id}/posts", [
            'platform' => 'linkedin',
            'post_text' => 'We just rolled out our next-generation enterprise AI orchestration engine.',
            'observed_themes' => ['ai_orchestration', 'enterprise_saas'],
            'engagement_signals' => ['likes' => 320, 'comments' => 45, 'shares' => 88],
            'tone' => 'authoritative',
        ]);

        $postRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.platform', 'linkedin');

        // Query Insights
        $insightsRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandA->id}/competitor-insights");

        $insightsRes->assertStatus(200)
            ->assertJsonPath('data.total_competitors', 1)
            ->assertJsonPath('data.total_posts_observed', 1)
            ->assertJsonPath('data.total_engagements_observed', 453);
    }

    public function test_competitor_gaps_identifies_untapped_pillars(): void
    {
        // Brand has 2 pillars: "AI Orchestration" and "Security Hardening"
        ContentPillar::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'AI Orchestration',
            'slug' => 'ai-orchestration',
            'weight_percentage' => 50,
        ]);

        $pillarUntapped = ContentPillar::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Security Hardening',
            'slug' => 'security-hardening',
            'weight_percentage' => 50,
        ]);

        $comp = CompetitorProfile::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Rival Corp',
            'status' => 'active',
        ]);

        // Competitor only posts about "ai_orchestration"
        CompetitorPost::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'competitor_profile_id' => $comp->id,
            'platform' => 'linkedin',
            'post_text' => 'New AI Orchestration algorithms released.',
            'observed_themes' => ['ai_orchestration'],
        ]);

        // Query gaps
        $gapRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandA->id}/competitor-gaps");

        $gapRes->assertStatus(200)
            ->assertJsonPath('success', true);

        $whitespaces = collect($gapRes->json('data.whitespace_opportunities'));
        $this->assertTrue($whitespaces->contains('pillar_id', $pillarUntapped->id));
        $this->assertEquals(1, $gapRes->json('data.total_gaps_identified'));
    }

    public function test_trend_opportunity_detection_and_multi_factor_scoring(): void
    {
        $pillar = ContentPillar::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'DevOps Automation',
            'slug' => 'devops-automation',
            'weight_percentage' => 100,
        ]);

        // Detect opportunities
        $detectRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/brands/{$this->brandA->id}/opportunities/detect", [
            'limit' => 3,
        ]);

        $detectRes->assertStatus(201)
            ->assertJsonPath('success', true);

        $opps = $detectRes->json('data');
        $this->assertNotEmpty($opps);

        $opp = $opps[0];
        $this->assertNotEmpty($opp['title']);
        $this->assertNotEmpty($opp['angle']);
        $this->assertGreaterThan(0, $opp['overall_opportunity_score']);

        // Verify scoring service formula directly
        $service = app(TrendAnalysisService::class);
        $expectedScore = (int) round((0.35 * 90) + (0.35 * 80) + (0.30 * 70)); // 31.5 + 28 + 21 = 80.5 -> 81
        $calculatedScore = $service->calculateOpportunityScore(90, 80, 70);
        $this->assertEquals($expectedScore, $calculatedScore);
    }

    public function test_convert_opportunity_instantiates_content_item_and_variants(): void
    {
        $pillar = ContentPillar::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Enterprise Scalability',
            'slug' => 'enterprise-scalability',
            'weight_percentage' => 100,
        ]);

        $opp = ContentOpportunity::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_pillar_id' => $pillar->id,
            'title' => 'Scaling Kubernetes Deployments with Zero Downtime',
            'angle' => 'How autonomous canary rollouts reduce deployment risk by 90%',
            'why_it_matters' => 'DevOps teams are struggling with cloud infrastructure costs and outage risks.',
            'recommended_channels' => ['linkedin', 'facebook', 'instagram'],
            'urgency_score' => 85,
            'freshness_score' => 90,
            'overall_opportunity_score' => 88,
            'status' => 'new',
        ]);

        // Convert opportunity to draft content item
        $convertRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/research/opportunities/{$opp->id}/convert", [
            'generate_creative' => true,
        ]);

        $convertRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.opportunity.status', 'converted');

        $contentItemId = $convertRes->json('data.content_item.id');
        $this->assertNotEmpty($contentItemId);

        $contentItem = ContentItem::with('variants')->find($contentItemId);
        $this->assertNotNull($contentItem);
        $this->assertEquals('draft', $contentItem->status);
        $this->assertCount(3, $contentItem->variants);

        // Verify source context attached
        $this->assertEquals('content_opportunity', $contentItem->source_context['type']);
        $this->assertEquals($opp->id, $contentItem->source_context['opportunity_id']);
    }

    public function test_dismiss_opportunity_updates_status(): void
    {
        $opp = ContentOpportunity::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'Low Fit Opportunity',
            'angle' => 'Off-topic angle',
            'why_it_matters' => 'Irrelevant',
            'recommended_channels' => ['linkedin'],
            'status' => 'new',
        ]);

        $dismissRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/research/opportunities/{$opp->id}/dismiss");

        $dismissRes->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals('dismissed', $opp->fresh()->status);
    }

    public function test_cross_tenant_isolation_on_research_and_opportunity_endpoints(): void
    {
        $oppA = ContentOpportunity::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'Secret Opp A',
            'angle' => 'Classified angle',
            'why_it_matters' => 'Confidential',
            'recommended_channels' => ['linkedin'],
            'status' => 'new',
        ]);

        $compA = CompetitorProfile::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Competitor Under A',
            'status' => 'active',
        ]);

        // Tenant B attempts to convert Tenant A's opportunity -> 404
        $convertRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenB}",
            'X-Workspace-Id' => $this->workspaceB->id,
        ])->postJson("/api/v1/research/opportunities/{$oppA->id}/convert");

        $convertRes->assertStatus(404);

        // Tenant B attempts to dismiss Tenant A's opportunity -> 404
        $dismissRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenB}",
            'X-Workspace-Id' => $this->workspaceB->id,
        ])->postJson("/api/v1/research/opportunities/{$oppA->id}/dismiss");

        $dismissRes->assertStatus(404);

        // Tenant B attempts to update Tenant A's competitor -> 404
        $updateCompRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenB}",
            'X-Workspace-Id' => $this->workspaceB->id,
        ])->putJson("/api/v1/research/competitors/{$compA->id}", [
            'name' => 'Hijacked Competitor',
        ]);

        $updateCompRes->assertStatus(404);
    }
}

