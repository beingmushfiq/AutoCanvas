<?php

namespace Tests\Feature;

use App\Modules\Research\Models\CompetitorProfile;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompetitorTrackerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_can_manage_competitor_profiles(): void
    {
        $auth = $this->createAuthenticatedTenant();

        // 1. Create Competitor
        $createRes = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/brands/{$auth['brand_id']}/competitors", [
                'name' => 'Competitor Alpha',
                'website_url' => 'https://alpha.example.com',
                'social_handles' => [
                    'linkedin' => 'https://linkedin.com/company/alpha',
                    'facebook' => 'https://facebook.com/alphabrand',
                ],
                'strengths' => 'Strong enterprise sales presence',
                'weaknesses' => 'Slow product release velocity',
                'observation_frequency' => 'weekly',
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Competitor Alpha');

        $competitorId = $createRes->json('data.id');

        // 2. List Competitors
        $listRes = $this->withHeaders($auth['headers'])
            ->getJson("/api/v1/brands/{$auth['brand_id']}/competitors");

        $listRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Competitor Alpha');

        // 3. Update Competitor
        $updateRes = $this->withHeaders($auth['headers'])
            ->putJson("/api/v1/research/competitors/{$competitorId}", [
                'strengths' => 'Updated: Strong developer relations and enterprise presence',
            ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.strengths', 'Updated: Strong developer relations and enterprise presence');
    }

    public function test_can_log_competitor_posts_and_calculate_insights(): void
    {
        $auth = $this->createAuthenticatedTenant();

        $competitor = CompetitorProfile::create([
            'organization_id' => $auth['org_id'],
            'workspace_id' => $auth['ws_id'],
            'brand_id' => $auth['brand_id'],
            'name' => 'Beta Labs',
            'website_url' => 'https://betalabs.com',
            'status' => 'active',
        ]);

        // 1. Log Post 1
        $postRes1 = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/research/competitors/{$competitor->id}/posts", [
                'platform' => 'linkedin',
                'post_url' => 'https://linkedin.com/feed/update/urn:li:activity:12345',
                'post_text' => 'We just launched our new AI marketing automation tool! Here is the architecture...',
                'engagement_signals' => ['likes' => 120, 'comments' => 45, 'shares' => 12],
                'observed_themes' => ['ai_automation', 'product_launch', 'engineering'],
                'tone' => 'technical',
                'tactical_takeaway' => 'High engagement due to detailed architecture diagram.',
            ]);

        $postRes1->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.platform', 'linkedin');

        // 2. Log Post 2
        $postRes2 = $this->withHeaders($auth['headers'])
            ->postJson("/api/v1/research/competitors/{$competitor->id}/posts", [
                'platform' => 'linkedin',
                'post_text' => 'Proud to announce 10 new enterprise clients this quarter!',
                'engagement_signals' => ['likes' => 80, 'comments' => 10, 'shares' => 2],
                'observed_themes' => ['business_growth', 'ai_automation'],
                'tone' => 'celebratory',
            ]);

        $postRes2->assertStatus(201);

        // 3. Query Competitor Posts
        $postsList = $this->withHeaders($auth['headers'])
            ->getJson("/api/v1/research/competitors/{$competitor->id}/posts");

        $postsList->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // 4. Query Aggregated Insights
        $insightsRes = $this->withHeaders($auth['headers'])
            ->getJson("/api/v1/brands/{$auth['brand_id']}/competitor-insights");

        $insightsRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_competitors', 1)
            ->assertJsonPath('data.total_posts_observed', 2)
            ->assertJsonPath('data.total_engagements_observed', 269); // (120+45+12) + (80+10+2) = 177 + 92 = 269

        // Verify top theme is ai_automation (appears twice)
        $topThemes = $insightsRes->json('data.top_themes');
        $this->assertEquals('ai_automation', $topThemes[0]['theme']);
        $this->assertEquals(2, $topThemes[0]['count']);
    }

    public function test_tenant_isolation_on_competitor_records(): void
    {
        $tenantA = $this->createAuthenticatedTenant('owner_a@test.com');
        $tenantB = $this->createAuthenticatedTenant('owner_b@test.com');

        $compA = CompetitorProfile::create([
            'organization_id' => $tenantA['org_id'],
            'workspace_id' => $tenantA['ws_id'],
            'brand_id' => $tenantA['brand_id'],
            'name' => 'Tenant A Secret Competitor',
            'status' => 'active',
        ]);

        // Tenant B cannot view or log posts for Tenant A's competitor
        $postsRes = $this->withHeaders($tenantB['headers'])
            ->getJson("/api/v1/research/competitors/{$compA->id}/posts");

        $this->assertContains($postsRes->status(), [403, 404]);

        $logRes = $this->withHeaders($tenantB['headers'])
            ->postJson("/api/v1/research/competitors/{$compA->id}/posts", [
                'platform' => 'linkedin',
                'post_text' => 'Unauthorized probe',
            ]);

        $this->assertContains($logRes->status(), [403, 404]);
    }

    protected function createAuthenticatedTenant(string $email = 'tracker@test.com'): array
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Tracker',
            'email' => $email,
            'password' => 'secret123',
            'organization_name' => 'Tracking Corp',
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
                'name' => 'Apex Brand',
                'industry' => 'SaaS',
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
