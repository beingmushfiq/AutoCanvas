<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Publishing\Jobs\PublishVariantJob;
use App\Modules\Publishing\Models\PublishingDispatch;
use App\Modules\Publishing\Services\PublishingOrchestratorService;
use App\Modules\SocialConnectors\Models\SocialAccount;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Carbon\Carbon;
use Database\Seeders\ControlPlaneSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublishingEngineTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $orgA;
    protected Workspace $workspaceA;
    protected User $userA;
    protected string $tokenA;
    protected Brand $brandA;
    protected SocialAccount $socialAccountA;

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
            'name' => 'Publishing Agency A',
            'slug' => 'pub-agency-a',
            'billing_email' => 'admin@puba.com',
        ]);
        $this->workspaceA = Workspace::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Main Workspace A',
            'slug' => 'ws-a',
        ]);
        $this->userA = User::create([
            'name' => 'Publisher Alice',
            'email' => 'alice@puba.com',
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
            'name' => 'Global Brand A',
            'slug' => 'global-brand-a',
            'status' => 'active',
        ]);

        $this->socialAccountA = SocialAccount::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'platform' => 'facebook',
            'provider_id' => 'page_123456',
            'account_name' => 'Brand A Official Page',
            'access_token' => 'valid_fb_access_token_abc123',
            'connection_status' => 'connected',
            'expires_at' => Carbon::now()->addDays(60),
            'is_active' => true,
        ]);

        // Setup Tenant B
        $this->orgB = Organization::create([
            'name' => 'Publishing Agency B',
            'slug' => 'pub-agency-b',
            'billing_email' => 'admin@pubb.com',
        ]);
        $this->workspaceB = Workspace::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Main Workspace B',
            'slug' => 'ws-b',
        ]);
        $this->userB = User::create([
            'name' => 'Publisher Bob',
            'email' => 'bob@pubb.com',
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
            'name' => 'Global Brand B',
            'slug' => 'global-brand-b',
            'status' => 'active',
        ]);
    }

    public function test_idempotent_publishing_rejects_duplicate_dispatch_within_lease_window(): void
    {
        Http::fake([
            'https://graph.facebook.com/*' => Http::response([
                'id' => 'page_123456_post_8899',
            ], 200),
        ]);

        $item = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'Autonomous Social Post',
            'concept' => 'High-velocity brand scaling announcement',
            'status' => 'approved',
        ]);

        $variant = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'content_item_id' => $item->id,
            'platform' => 'facebook',
            'caption' => 'Scaling autonomous publishing across enterprise marketing pipelines.',
            'hashtags' => ['AutonomousAgents', 'Scale'],
        ]);

        $customKey = "idemp_test_lease_key_999";

        // First Dispatch
        $res1 = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/content/variants/{$variant->id}/publish-now", [
            'idempotency_key' => $customKey,
        ]);

        $res1 = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/content/variants/{$variant->id}/publish-now", [
            'idempotency_key' => $customKey,
        ]);

        $res1->assertStatus(200)
            ->assertJsonPath('success', true);

        $dispatchId1 = $res1->json('data.id');

        // Immediate Duplicate Dispatch with identical idempotency key
        $res2 = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/content/variants/{$variant->id}/publish-now", [
            'idempotency_key' => $customKey,
        ]);

        $res2->assertStatus(200)
            ->assertJsonPath('success', true);

        $dispatchId2 = $res2->json('data.id');

        // Must be completely deduplicated: exact same dispatch ID, exactly 1 row in database
        $this->assertEquals($dispatchId1, $dispatchId2);
        $this->assertEquals(1, PublishingDispatch::where('idempotency_key', $customKey)->count());
    }

    public function test_unapproved_variant_cannot_be_dispatched(): void
    {
        $item = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'Unapproved Draft Post',
            'concept' => 'Draft copy not yet reviewed',
            'status' => 'draft', // Not approved!
        ]);

        $variant = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'content_item_id' => $item->id,
            'platform' => 'facebook',
            'caption' => 'Draft copy attempting illegal publish.',
            'hashtags' => ['draft'],
        ]);

        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/content/variants/{$variant->id}/publish-now");

        $res->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'PUBLISHING_GATE_BLOCKED');

        $this->assertEquals(0, PublishingDispatch::count());
    }

    public function test_expired_social_token_blocks_dispatch(): void
    {
        // Expire account token
        $this->socialAccountA->update([
            'expires_at' => Carbon::now()->subDays(5),
        ]);

        $item = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'Approved Content',
            'concept' => 'Ready to publish',
            'status' => 'approved',
        ]);

        $variant = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'content_item_id' => $item->id,
            'platform' => 'facebook',
            'caption' => 'Content ready but token expired.',
            'hashtags' => ['expired'],
        ]);

        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/content/variants/{$variant->id}/publish-now");

        $res->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'PUBLISHING_GATE_BLOCKED');
    }

    public function test_emergency_circuit_breaker_halts_active_queue_execution(): void
    {
        // 1. Activate emergency circuit breaker
        $pauseRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson('/api/v1/publishing/circuit-breaker/pause');

        $pauseRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('paused', true);

        // 2. Query status
        $statusRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson('/api/v1/publishing/circuit-breaker/status');

        $statusRes->assertStatus(200)
            ->assertJsonPath('paused', true);

        // 3. Attempt dispatch while paused -> Rejected immediately
        $item = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'Halted Post',
            'concept' => 'Blocked by emergency stop',
            'status' => 'approved',
        ]);

        $variant = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'content_item_id' => $item->id,
            'platform' => 'facebook',
            'caption' => 'Should never dispatch during emergency pause.',
            'hashtags' => ['pause'],
        ]);

        $dispatchRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/content/variants/{$variant->id}/publish-now");

        $dispatchRes->assertStatus(422)
            ->assertJsonPath('error.code', 'PUBLISHING_GATE_BLOCKED');

        // 4. Resume circuit breaker
        $resumeRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson('/api/v1/publishing/circuit-breaker/resume');

        $resumeRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('paused', false);
    }

    public function test_successful_remote_publish_settles_dispatch_and_variant_status(): void
    {
        Http::fake([
            'https://graph.facebook.com/*' => Http::response([
                'id' => 'page_post_success_101',
            ], 200),
        ]);

        $item = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'Live Enterprise Update',
            'concept' => 'High impact social announcement',
            'status' => 'approved',
        ]);

        $variant = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'content_item_id' => $item->id,
            'platform' => 'facebook',
            'caption' => 'Announcing our verified production cluster deployment.',
            'hashtags' => ['prod', 'release'],
        ]);

        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/content/variants/{$variant->id}/publish-now");

        $res->assertStatus(200);

        $dispatchId = $res->json('data.id');
        $dispatch = PublishingDispatch::find($dispatchId);

        $this->assertEquals('published', $dispatch->status);
        $this->assertEquals('page_post_success_101', $dispatch->platform_post_id);
        $this->assertStringContainsString('page_post_success_101', $dispatch->platform_permalink);

        $variant->refresh();
        $this->assertEquals('published', $variant->publishing_status);
        $this->assertNotNull($variant->published_at);

        $item->refresh();
        $this->assertEquals('published', $item->status);
    }

    public function test_transient_error_routes_to_retry_queue_with_exponential_backoff(): void
    {
        // Mock remote platform rate limit (HTTP 429)
        Http::fake([
            'https://graph.facebook.com/*' => Http::response([
                'error' => [
                    'message' => 'Rate limit exceeded. Too many requests in 60s.',
                    'code' => 429,
                ],
            ], 429),
        ]);

        $item = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'High Frequency Post',
            'concept' => 'Testing transient retry behavior',
            'status' => 'approved',
        ]);

        $variant = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'content_item_id' => $item->id,
            'platform' => 'facebook',
            'caption' => 'Rate limit retry testing.',
            'hashtags' => ['ratelimit'],
        ]);

        $dispatch = PublishingDispatch::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $item->id,
            'content_variant_id' => $variant->id,
            'social_account_id' => $this->socialAccountA->id,
            'idempotency_key' => 'idemp_retry_test_' . rand(1000, 9999),
            'queue_name' => 'publishing-high',
            'status' => 'queued',
            'attempts' => 0,
            'payload_snapshot' => ['caption' => $variant->caption, 'platform' => 'facebook'],
        ]);

        // Execute job manually
        $job = new PublishVariantJob($dispatch->id);
        $job->handle(app(PublishingOrchestratorService::class));

        $dispatch->refresh();

        // Must be routed to publishing-retry queue with TRANSIENT_RETRY code
        $this->assertEquals('queued', $dispatch->status);
        $this->assertEquals('publishing-retry', $dispatch->queue_name);
        $this->assertEquals('TRANSIENT_RETRY', $dispatch->error_code);
        $this->assertStringContainsString('Rate limit', $dispatch->error_message);
        $this->assertEquals(1, $dispatch->attempts);
    }

    public function test_reconciliation_command_detects_and_resolves_stuck_publishing_jobs(): void
    {
        $item = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'Stuck Job Test',
            'concept' => 'Post orphaned during worker termination',
            'status' => 'approved',
        ]);

        $variant = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'content_item_id' => $item->id,
            'platform' => 'facebook',
            'caption' => 'Orphaned worker test.',
            'hashtags' => ['worker'],
        ]);

        // 1. Create a dispatch stuck in 'processing' 30 minutes ago
        $stuckDispatch = PublishingDispatch::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $item->id,
            'content_variant_id' => $variant->id,
            'social_account_id' => $this->socialAccountA->id,
            'idempotency_key' => 'idemp_stuck_test_1',
            'queue_name' => 'publishing-high',
            'status' => 'processing',
            'attempts' => 1,
            'payload_snapshot' => ['caption' => $variant->caption],
        ]);
        // Fast-forward timestamp
        $stuckDispatch->updated_at = Carbon::now()->subMinutes(30);
        $stuckDispatch->save();

        // 2. Create a dispatch marked 'published' with missing permalink
        $missingLinkDispatch = PublishingDispatch::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $item->id,
            'content_variant_id' => $variant->id,
            'social_account_id' => $this->socialAccountA->id,
            'idempotency_key' => 'idemp_missing_link_test_2',
            'queue_name' => 'publishing-high',
            'status' => 'published',
            'platform_post_id' => 'fb_post_reconcile_999',
            'platform_permalink' => null, // Missing!
            'payload_snapshot' => ['caption' => $variant->caption, 'platform' => 'facebook'],
            'published_at' => Carbon::now()->subHours(2),
        ]);

        // Run reconciliation command
        $this->artisan('publishing:reconcile --timeout-minutes=15')
            ->assertSuccessful();

        $stuckDispatch->refresh();
        $this->assertEquals('failed', $stuckDispatch->status);
        $this->assertEquals('PROCESSING_TIMEOUT_EXPIRED', $stuckDispatch->error_code);

        $missingLinkDispatch->refresh();
        $this->assertNotEmpty($missingLinkDispatch->platform_permalink);
        $this->assertStringContainsString('fb_post_reconcile_999', $missingLinkDispatch->platform_permalink);
    }

    public function test_cross_tenant_isolation_on_publishing_endpoints(): void
    {
        $itemA = ContentItem::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'title' => 'Org A Post',
            'concept' => 'Secret Org A Content',
            'status' => 'approved',
        ]);

        $variantA = ContentVariant::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'content_item_id' => $itemA->id,
            'platform' => 'facebook',
            'caption' => 'Confidential campaign copy.',
            'hashtags' => ['secret'],
        ]);

        $dispatchA = PublishingDispatch::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'content_item_id' => $itemA->id,
            'content_variant_id' => $variantA->id,
            'social_account_id' => $this->socialAccountA->id,
            'idempotency_key' => 'idemp_cross_tenant_1',
            'queue_name' => 'publishing-high',
            'status' => 'queued',
            'payload_snapshot' => ['caption' => 'test'],
        ]);

        // Tenant B attempts to read Tenant A's dispatch
        $showRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenB}",
            'X-Workspace-Id' => $this->workspaceB->id,
        ])->getJson("/api/v1/publishing/dispatches/{$dispatchA->id}");

        $showRes->assertStatus(404);

        // Tenant B attempts to cancel Tenant A's dispatch
        $cancelRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenB}",
            'X-Workspace-Id' => $this->workspaceB->id,
        ])->postJson("/api/v1/publishing/dispatches/{$dispatchA->id}/cancel");

        $cancelRes->assertStatus(404);

        // Tenant B attempts to publish Tenant A's variant
        $publishRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenB}",
            'X-Workspace-Id' => $this->workspaceB->id,
        ])->postJson("/api/v1/content/variants/{$variantA->id}/publish-now");

        $publishRes->assertStatus(404);
    }
}
