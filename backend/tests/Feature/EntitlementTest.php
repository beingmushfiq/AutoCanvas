<?php

namespace Tests\Feature;

use App\Modules\Billing\Models\Plan;
use App\Modules\Organization\Models\Organization;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EntitlementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_workspace_limit_is_strictly_enforced_by_subscription_plan(): void
    {
        // 1. Register organization on Starter plan (max_workspaces = 1)
        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'Startup Founder',
            'email' => 'founder@startup.com',
            'password' => 'password123',
            'organization_name' => 'Startup Co',
        ]);
        $token = $res->json('data.token');
        $orgId = $res->json('data.organization.id');
        $workspaceId = $res->json('data.workspace.id');

        // 2. Attempting to create a 2nd workspace under Starter plan -> Must fail with 402 Payment Required
        $createResponse = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $workspaceId,
        ])->postJson('/api/v1/workspaces', [
            'name' => 'Second Workspace',
        ]);

        $createResponse->assertStatus(402);

        // 3. Upgrade organization to Growth plan (max_workspaces = 3)
        $growthPlan = Plan::where('slug', 'growth')->firstOrFail();
        $org = Organization::findOrFail($orgId);
        $org->subscription->update([
            'plan_id' => $growthPlan->id,
        ]);

        // 4. Now creating the 2nd workspace -> Must succeed (201)
        $successResponse = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $workspaceId,
        ])->postJson('/api/v1/workspaces', [
            'name' => 'Second Workspace',
        ]);

        $successResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Second Workspace',
                ],
            ]);
    }
}
