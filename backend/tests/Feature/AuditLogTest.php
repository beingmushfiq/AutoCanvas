<?php

namespace Tests\Feature;

use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_mutating_actions_produce_persistent_audit_logs(): void
    {
        // 1. Register user
        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'Dan Auditor',
            'email' => 'dan@audit.com',
            'password' => 'password123',
            'organization_name' => 'Audit Enterprise',
        ]);
        $token = $res->json('data.token');
        $orgId = $res->json('data.organization.id');
        $workspaceId = $res->json('data.workspace.id');

        // 2. Update organization
        $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/organizations/{$orgId}", [
                'name' => 'Audit Enterprise International',
            ]);

        // 3. Query audit logs
        $logsResponse = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $workspaceId,
        ])->getJson('/api/v1/audit-logs');

        $logsResponse->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'action',
                        'old_values',
                        'new_values',
                        'created_at',
                    ],
                ],
            ]);

        $actions = collect($logsResponse->json('data'))->pluck('action')->all();

        $this->assertContains('organization.created', $actions);
        $this->assertContains('organization.updated', $actions);
    }
}
