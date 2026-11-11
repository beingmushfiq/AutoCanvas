<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Analytics\Models\AnalyticsSnapshot;
use App\Modules\Analytics\Models\PostAnalytics;
use App\Modules\Brand\Models\Brand;
use App\Modules\Brand\Models\BrandProfile;
use App\Modules\Brand\Models\BrandVoiceProfile;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\ContentStrategy\Models\ContentPillar;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Publishing\Models\PublishingDispatch;
use App\Modules\SocialConnectors\Models\SocialAccount;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Carbon\Carbon;
use Database\Seeders\ControlPlaneSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AnalyticsEngineTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $orgA;
    protected Workspace $workspaceA;
    protected Brand $brandA;
    protected User $userA;
    protected string $tokenA;
    protected SocialAccount $accountA;

    protected Organization $orgB;
    protected Workspace $workspaceB;
    protected Brand $brandB;
    protected User $userB;
    protected string $tokenB;
    protected SocialAccount $accountB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        $this->seed(RbacSeeder::class);
        $this->seed(ControlPlaneSeeder::class);

        // --- Tenant A Setup ---
        $this->orgA = Organization::create([
            'name' => 'Analytics Alpha Org',
            'slug' => 'analytics-alpha',
            'billing_email' => 'admin@alpha.com',
            'status' => 'active',
        ]);
        $this->workspaceA = Workspace::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Alpha Primary Workspace',
            'slug' => 'alpha-primary',
            'is_default' => true,
        ]);
        $this->brandA = Brand::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Alpha Studio',
            'slug' => 'alpha-studio',
            'status' => 'active',
        ]);
        BrandProfile::create([
            'organization_id' => $this->orgA->id,
            'brand_id' => $this->brandA->id,
            'mission' => 'Empowering intelligent telemetry',
            'prohibited_subjects' => ['gambling'],
        ]);
        BrandVoiceProfile::create([
            'organization_id' => $this->orgA->id,
            'brand_id' => $this->brandA->id,
            'tone' => 'direct and authoritative',
            'formality_level' => 'conversational',
        ]);
        $this->userA = User::create([
            'name' => 'Alice Analyst',
            'email' => 'alice@alpha.com',
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

        $this->accountA = SocialAccount::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'platform' => 'facebook',
            'provider_id' => 'fb_page_alpha_1',
            'account_type' => 'page',
            'account_name' => 'Alpha Facebook Page',
            'access_token' => 'mock_token_alpha_1',
            'expires_at' => Carbon::now()->addDays(60),
            'is_active' => true,
            'connection_status' => 'connected',
        ]);

        // --- Tenant B Setup ---
        $this->orgB = Organization::create([
            'name' => 'Beta Corp',
            'slug' => 'beta-corp',
            'billing_email' => 'billing@beta.com',
            'status' => 'active',
        ]);
        $this->workspaceB = Workspace::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Beta Primary',
            'slug' => 'beta-primary',
            'is_default' => true,
        ]);
        $this->brandB = Brand::create([
            'organization_id' => $this->orgB->id,
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Beta Brand',
            'slug' => 'beta-brand',
            'status' => 'active',
        ]);
        $this->userB = User::create([
            'name' => 'Bob Beta',
            'email' => 'bob@beta.com',
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

        $this->accountB = SocialAccount::create([
            'organization_id' => $this->orgB->id,
            'workspace_id' => $this->workspaceB->id,
            'brand_id' => $this->brandB->id,
            'platform' => 'facebook',
            'provider_id' => 'fb_page_beta_2',
            'account_type' => 'page',
            'account_name' => 'Beta Facebook Page',
            'access_token' => 'mock_token_beta_2',
            'expires_at' => Carbon::now()->addDays(60),
            'is_active' => true,
            'connection_status' => 'connected',
        ]);
    }

    public function test_daily_snapshot_aggregation_and_timeseries_retrieval(): void
    {
        $today = Carbon::today();

        // Seed 3 days of snapshots for Tenant A
        AnalyticsSnapshot::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'social_account_id' => $this->accountA->id,
            'platform' => 'facebook',
            'snapshot_date' => $today->copy()->subDays(2)->toDateString(),
            'impressions' => 1000,
            'reach' => 800,
            'engagements' => 100,
            'clicks' => 40,
            'video_views' => 200,
            'net_follower_change' => 15,
            'engagement_rate' => 10.0,
        ]);

        AnalyticsSnapshot::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'social_account_id' => $this->accountA->id,
            'platform' => 'facebook',
            'snapshot_date' => $today->copy()->subDay()->toDateString(),
            'impressions' => 2000,
            'reach' => 1600,
            'engagements' => 250,
            'clicks' => 90,
            'video_views' => 450,
            'net_follower_change' => 25,
            'engagement_rate' => 12.5,
        ]);

        AnalyticsSnapshot::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'social_account_id' => $this->accountA->id,
            'platform' => 'facebook',
            'snapshot_date' => $today->toDateString(),
            'impressions' => 3000,
            'reach' => 2400,
            'engagements' => 350,
            'clicks' => 120,
            'video_views' => 600,
            'net_follower_change' => 30,
            'engagement_rate' => 11.67,
        ]);

        // 1. Fetch Overview KPIs
        $overviewRes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandA->id}/analytics/overview?start_date={$today->copy()->subDays(2)->toDateString()}&end_date={$today->toDateString()}");

        $overviewRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.kpis.impressions.value', 6000)
            ->assertJsonPath('data.kpis.reach.value', 4800)
            ->assertJsonPath('data.kpis.engagements.value', 700)
            ->assertJsonPath('data.kpis.clicks.value', 250)
            ->assertJsonPath('data.kpis.follower_growth.value', 70);

        // 2. Fetch Daily Time Series
        $timeseriesRes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandA->id}/analytics/timeseries?start_date={$today->copy()->subDays(2)->toDateString()}&end_date={$today->toDateString()}");

        $timeseriesRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }

    public function test_post_analytics_ingestion_and_attribution_to_content_pillar(): void
    {
        $pillar = ContentPillar::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Engineering Excellence',
            'slug' => 'engineering-excellence',
            'weight_percentage' => 40,
            'color_tag' => 'brand-accent',
        ]);

        $item = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_pillar_id' => $pillar->id,
            'title' => 'Scaling Distributed Queues with Redis Locks',
            'concept' => 'High-performance system design',
            'status' => 'published',
        ]);

        $variant = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $item->id,
            'platform' => 'facebook',
            'caption' => 'How we maintain zero race conditions across publishing jobs.',
            'hashtags' => ['engineering', 'redis'],
        ]);

        $payload = [
            'platform_post_id' => 'fb_live_post_101',
            'likes' => 85,
            'comments' => 15,
            'shares' => 10,
            'clicks' => 40,
            'impressions' => 1500,
            'reach' => 1200,
        ];

        $res = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/content/variants/{$variant->id}/analytics", $payload);

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.content_pillar_id', $pillar->id)
            ->assertJsonPath('data.likes_count', 85)
            ->assertJsonPath('data.impressions_count', 1500);

        // Verify Engagement Rate: (85 + 15 + 10 + 40) / 1500 = 150 / 1500 = 10.00%
        $postAnalytics = PostAnalytics::where('content_variant_id', $variant->id)->first();
        $this->assertNotNull($postAnalytics);
        $this->assertEquals(10.0, $postAnalytics->engagement_rate);
    }

    public function test_content_pillar_roi_calculation_and_ranking(): void
    {
        $now = Carbon::now();

        // Pillar 1: High Engagement Rate
        $pillarTech = ContentPillar::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Deep Tech',
            'slug' => 'deep-tech',
            'weight_percentage' => 50,
        ]);

        // Pillar 2: Low Engagement Rate
        $pillarNews = ContentPillar::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'General News',
            'slug' => 'general-news',
            'weight_percentage' => 50,
        ]);

        $itemTech = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_pillar_id' => $pillarTech->id,
            'title' => 'Deep Tech Breakthroughs',
            'concept' => 'Tech overview',
            'status' => 'published',
        ]);
        $variantTech = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $itemTech->id,
            'platform' => 'facebook',
            'caption' => 'Tech news',
            'hashtags' => [],
        ]);

        $itemNews = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_pillar_id' => $pillarNews->id,
            'title' => 'Weekly Roundup',
            'concept' => 'News roundup',
            'status' => 'published',
        ]);
        $variantNews = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $itemNews->id,
            'platform' => 'facebook',
            'caption' => 'General news',
            'hashtags' => [],
        ]);

        // PostAnalytics for Deep Tech: 200 engagements / 1000 impr = 20.0%
        PostAnalytics::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $itemTech->id,
            'content_variant_id' => $variantTech->id,
            'content_pillar_id' => $pillarTech->id,
            'platform' => 'facebook',
            'platform_post_id' => 'post_tech_01',
            'likes_count' => 150,
            'comments_count' => 30,
            'shares_count' => 20,
            'clicks_count' => 0,
            'impressions_count' => 1000,
            'reach_count' => 800,
            'engagement_rate' => 20.0,
            'published_at' => $now,
        ]);

        // PostAnalytics for General News: 10 engagements / 1000 impr = 1.0%
        PostAnalytics::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $itemNews->id,
            'content_variant_id' => $variantNews->id,
            'content_pillar_id' => $pillarNews->id,
            'platform' => 'facebook',
            'platform_post_id' => 'post_news_01',
            'likes_count' => 8,
            'comments_count' => 2,
            'shares_count' => 0,
            'clicks_count' => 0,
            'impressions_count' => 1000,
            'reach_count' => 800,
            'engagement_rate' => 1.0,
            'published_at' => $now,
        ]);

        $res = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandA->id}/analytics/pillars");

        $res->assertStatus(200)
            ->assertJsonPath('success', true);

        $data = $res->json('data');
        $this->assertCount(2, $data);
        // Deep Tech must be ranked #1 due to significantly higher ROI
        $this->assertEquals($pillarTech->id, $data[0]['pillar_id']);
        $this->assertEquals(20.0, $data[0]['avg_engagement_rate']);
        $this->assertTrue($data[0]['roi_score'] > $data[1]['roi_score']);
    }

    public function test_best_posting_times_heatmap_matrix_generation(): void
    {
        // Seed a post published on Tuesday (dayOfWeek = 2) at 10:00 AM with heavy engagement
        $tuesday10am = Carbon::parse('next Tuesday 10:00:00');

        $item = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'Heatmap Test Post',
            'concept' => 'Concept',
            'status' => 'published',
        ]);
        $variant = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $item->id,
            'platform' => 'facebook',
            'caption' => 'Tuesday morning post',
            'hashtags' => [],
        ]);

        PostAnalytics::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $item->id,
            'content_variant_id' => $variant->id,
            'platform' => 'facebook',
            'platform_post_id' => 'post_heat_01',
            'likes_count' => 300,
            'comments_count' => 100,
            'shares_count' => 50,
            'clicks_count' => 50,
            'impressions_count' => 2000,
            'engagement_rate' => 25.0,
            'published_at' => $tuesday10am,
        ]);

        $res = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandA->id}/analytics/best-times");

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'matrix',
                    'recommended_slots',
                ],
            ]);

        $slots = $res->json('data.recommended_slots');
        $this->assertNotEmpty($slots);
        $this->assertEquals(2, $slots[0]['day_index']); // Tuesday
        $this->assertEquals(10, $slots[0]['hour']); // 10 AM
        $this->assertEquals(1.0, $slots[0]['score']); // Normalized peak
    }

    public function test_top_performing_posts_ranking(): void
    {
        $item = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'Top Post Test',
            'concept' => 'Concept',
            'status' => 'published',
        ]);
        $variant1 = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $item->id,
            'platform' => 'facebook',
            'caption' => 'Variant 1',
            'hashtags' => [],
        ]);
        $variant2 = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $item->id,
            'platform' => 'instagram',
            'caption' => 'Variant 2',
            'hashtags' => [],
        ]);

        PostAnalytics::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $item->id,
            'content_variant_id' => $variant1->id,
            'platform' => 'facebook',
            'platform_post_id' => 'v1_post',
            'engagement_rate' => 5.2,
            'impressions_count' => 1000,
            'published_at' => Carbon::now(),
        ]);

        PostAnalytics::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $item->id,
            'content_variant_id' => $variant2->id,
            'platform' => 'instagram',
            'platform_post_id' => 'v2_post',
            'engagement_rate' => 18.5,
            'impressions_count' => 2000,
            'published_at' => Carbon::now(),
        ]);

        $res = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandA->id}/analytics/top-posts?limit=5");

        $res->assertStatus(200)
            ->assertJsonPath('success', true);

        $top = $res->json('data');
        $this->assertCount(2, $top);
        $this->assertEquals('v2_post', $top[0]['platform_post_id']);
        $this->assertEquals(18.5, $top[0]['engagement_rate']);
    }

    public function test_cross_tenant_isolation_on_analytics_endpoints(): void
    {
        // Tenant A attempts to access Tenant B's brand analytics overview -> 404
        $resOverview = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandB->id}/analytics/overview");
        $resOverview->assertStatus(404);

        // Tenant A attempts to access Tenant B's pillars -> 404
        $resPillars = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandB->id}/analytics/pillars");
        $resPillars->assertStatus(404);

        // Tenant A attempts to access Tenant B's best-times -> 404
        $resTimes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandB->id}/analytics/best-times");
        $resTimes->assertStatus(404);
    }

    public function test_analytics_sync_command_execution(): void
    {
        Http::fake([
            'https://graph.facebook.com/v21.0/*' => Http::response([
                'data' => [
                    ['name' => 'post_impressions', 'values' => [['value' => 250]]],
                ],
            ], 200),
        ]);

        $this->artisan('analytics:sync')
            ->assertExitCode(0);
    }

    public function test_system_telemetry_endpoint(): void
    {
        $res = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson('/api/v1/system/telemetry');

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'timestamp',
                    'circuit_breaker',
                    'queues',
                    'ai_telemetry',
                    'system_health',
                ],
            ]);
    }
}

