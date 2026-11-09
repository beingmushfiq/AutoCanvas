<?php

namespace Tests\Feature;

use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_user_cannot_access_or_query_another_organizations_workspace(): void
    {
        // 1. Register Tenant A
        $resA = $this->postJson('/api/v1/auth/register', [
            'name' => 'Alice Tenant',
            'email' => 'alice@tenanta.com',
            'password' => 'password123',
            'organization_name' => 'Company A',
        ]);
        $tokenA = $resA->json('data.token');
        $orgAId = $resA->json('data.organization.id');
        $workspaceAId = $resA->json('data.workspace.id');

        // 2. Register Tenant B
        $resB = $this->postJson('/api/v1/auth/register', [
            'name' => 'Bob Tenant',
            'email' => 'bob@tenantb.com',
            'password' => 'password123',
            'organization_name' => 'Company B',
        ]);
        $tokenB = $resB->json('data.token');
        $orgBId = $resB->json('data.organization.id');
        $workspaceBId = $resB->json('data.workspace.id');

        // 3. User B attempts to access Organization A details -> Must be blocked (403)
        $response = $this->withHeader('Authorization', "Bearer {$tokenB}")
            ->getJson("/api/v1/organizations/{$orgAId}");

        $response->assertStatus(403);

        // 4. User B attempts to spoof X-Workspace-Id to access Workspace A -> Must be blocked (403)
        $spoofResponse = $this->withHeaders([
            'Authorization' => "Bearer {$tokenB}",
            'X-Workspace-Id' => $workspaceAId,
        ])->getJson('/api/v1/workspaces');

        $spoofResponse->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'TENANT_ACCESS_DENIED',
                ],
            ]);

        // 5. Legitimate queries by User B must ONLY return Tenant B's workspaces
        $legitResponse = $this->withHeaders([
            'Authorization' => "Bearer {$tokenB}",
            'X-Workspace-Id' => $workspaceBId,
        ])->getJson('/api/v1/workspaces');

        $legitResponse->assertStatus(200);
        $workspaces = $legitResponse->json('data');

        $this->assertCount(1, $workspaces);
        $this->assertEquals($workspaceBId, $workspaces[0]['id']);
        $this->assertNotEquals($workspaceAId, $workspaces[0]['id']);
    }
}
