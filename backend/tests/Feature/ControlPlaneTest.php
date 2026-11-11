<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Billing\Models\Plan;
use App\Modules\Billing\Models\Subscription;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use Database\Seeders\ControlPlaneSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ControlPlaneTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected string $adminToken;
    protected User $regularUser;
    protected string $userToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        $this->seed(RbacSeeder::class);
        $this->seed(ControlPlaneSeeder::class);

        // Superadmin User
        $this->superAdmin = User::create([
            'name' => 'Master Architect',
            'email' => 'admin@autocanvas.io',
            'password' => bcrypt('secret123'),
            'is_platform_admin' => true,
            'status' => 'active',
        ]);
        $this->superAdmin->assignRole('superadmin');
        $this->adminToken = $this->superAdmin->createToken('admin_token')->plainTextToken;

        // Regular Tenant User
        $this->regularUser = User::create([
            'name' => 'Regular Tenant',
            'email' => 'tenant@example.com',
            'password' => bcrypt('secret123'),
            'is_platform_admin' => false,
            'status' => 'active',
        ]);
        $this->userToken = $this->regularUser->createToken('user_token')->plainTextToken;
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $res = $this->getJson('/api/v1/control-plane/metrics');
        $res->assertStatus(401);
    }

    public function test_non_admin_user_cannot_access_control_plane(): void
    {
        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->userToken}",
        ])->getJson('/api/v1/control-plane/metrics');

        $res->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'ACCESS_DENIED',
                ],
            ]);
    }

    public function test_admin_can_retrieve_platform_metrics(): void
    {
        // Create an organization with active subscription
        $org = Organization::create([
            'name' => 'Metrics Org',
            'slug' => 'metrics-org',
            'billing_email' => 'metrics@example.com',
            'status' => 'active',
        ]);

        $growthPlan = Plan::where('slug', 'growth')->firstOrFail();
        Subscription::create([
            'organization_id' => $org->id,
            'plan_id' => $growthPlan->id,
            'status' => 'active',
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
        ]);

        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->getJson('/api/v1/control-plane/metrics');

        $res->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'financial' => ['mrr_usd', 'arr_usd', 'active_subscriptions_count'],
                    'tenancy' => ['total_organizations', 'active_organizations', 'total_users'],
                    'publishing' => ['completed_24h', 'failed_24h', 'pending_backlog', 'success_rate_percentage'],
                    'ai_infrastructure' => ['input_tokens_24h', 'output_tokens_24h', 'estimated_cost_usd_24h'],
                    'timestamp',
                ],
            ]);

        $this->assertEquals(79.00, $res->json('data.financial.mrr_usd'));
        $this->assertEquals(948.00, $res->json('data.financial.arr_usd'));
    }

    public function test_admin_can_suspend_and_activate_tenant(): void
    {
        $org = Organization::create([
            'name' => 'Demo Org',
            'slug' => 'demo-org',
            'billing_email' => 'demo@example.com',
            'status' => 'active',
        ]);

        // Suspend
        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->putJson("/api/v1/control-plane/organizations/{$org->id}/status", [
            'status' => 'suspended',
            'reason' => 'Billing delinquent',
        ]);

        $res->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $org->id,
                    'status' => 'suspended',
                ],
            ]);

        $this->assertEquals('suspended', $org->fresh()->status);

        // Verify System Change Log was recorded
        $this->assertDatabaseHas('system_change_logs', [
            'entity_type' => 'organization',
            'entity_id' => $org->id,
            'action' => 'organization.suspended',
        ]);

        // Activate
        $activateRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->putJson("/api/v1/control-plane/organizations/{$org->id}/status", [
            'status' => 'active',
        ]);

        $activateRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $org->id,
                    'status' => 'active',
                ],
            ]);

        $this->assertEquals('active', $org->fresh()->status);
    }

    public function test_admin_can_update_settings_with_diff_logging(): void
    {
        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->putJson('/api/v1/control-plane/settings', [
            'key' => 'daily_ai_budget_cap_usd',
            'value' => 250.00,
            'category' => 'ai',
        ]);

        $res->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'key' => 'daily_ai_budget_cap_usd',
                    'value' => 250.00,
                ],
            ]);

        // Verify change logs endpoint returns the change
        $logsRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->getJson('/api/v1/control-plane/settings/change-logs');

        $logsRes->assertStatus(200);
        $this->assertTrue(collect($logsRes->json('data'))->contains('entity_id', 'daily_ai_budget_cap_usd'));
    }

    public function test_circuit_breaker_toggle(): void
    {
        // Toggle on
        $pauseRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->postJson('/api/v1/control-plane/circuit-breaker/toggle', [
            'pause' => true,
        ]);

        $pauseRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'pause_all_automations' => true,
                    'status' => 'HALTED',
                ],
            ]);

        // Status check
        $statusRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->getJson('/api/v1/control-plane/circuit-breaker');

        $statusRes->assertStatus(200)
            ->assertJson([
                'data' => [
                    'pause_all_automations' => true,
                    'status' => 'HALTED',
                ],
            ]);

        // Toggle off
        $resumeRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->postJson('/api/v1/control-plane/circuit-breaker/toggle', [
            'pause' => false,
        ]);

        $resumeRes->assertStatus(200)
            ->assertJson([
                'data' => [
                    'pause_all_automations' => false,
                    'status' => 'OPERATIONAL',
                ],
            ]);
    }

    public function test_master_command_safe_execution(): void
    {
        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->postJson('/api/v1/control-plane/command', [
            'query' => 'show telemetry metrics',
        ]);

        $res->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'executed',
                    'intent' => 'ACTION_GET_METRICS',
                    'safety_tier' => 'safe',
                ],
            ]);
    }

    public function test_master_command_destructive_requires_confirmation(): void
    {
        $org = Organization::create([
            'name' => 'Target Org',
            'slug' => 'target-org',
            'billing_email' => 'target@example.com',
            'status' => 'active',
        ]);

        // 1. Initial destructive command
        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->postJson('/api/v1/control-plane/command', [
            'query' => 'suspend organization target-org',
        ]);

        $res->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'pending_confirmation',
                    'intent' => 'ACTION_SUSPEND_TENANT',
                    'safety_tier' => 'destructive',
                ],
            ]);

        $token = $res->json('data.confirmation_token');
        $this->assertNotEmpty($token);

        // Verify organization is still active prior to confirmation
        $this->assertEquals('active', $org->fresh()->status);

        // 2. Submit confirmation token
        $confirmRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->postJson('/api/v1/control-plane/command/confirm', [
            'confirmation_token' => $token,
        ]);

        $confirmRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'executed',
                    'intent' => 'ACTION_SUSPEND_TENANT',
                ],
            ]);

        // Verify organization is now suspended
        $this->assertEquals('suspended', $org->fresh()->status);
    }

    public function test_admin_impersonation_token_generation(): void
    {
        $org = Organization::create([
            'name' => 'Client Org',
            'slug' => 'client-org',
            'billing_email' => 'client@example.com',
            'status' => 'active',
        ]);

        $owner = User::create([
            'name' => 'Client Owner',
            'email' => 'owner@client.com',
            'password' => bcrypt('secret123'),
            'status' => 'active',
        ]);

        OrganizationMember::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role' => 'owner',
        ]);

        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->postJson("/api/v1/control-plane/organizations/{$org->id}/impersonate");

        $res->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'token',
                    'expires_at',
                    'impersonated_organization' => ['id', 'name', 'slug'],
                ],
            ]);
    }
}
