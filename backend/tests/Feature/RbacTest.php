<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Billing\Models\Plan;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Workspace\Models\WorkspaceMember;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_owner_can_invite_members_but_viewer_cannot(): void
    {
        // 1. Owner registers
        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'Org Owner',
            'email' => 'owner@acme.com',
            'password' => 'password123',
            'organization_name' => 'Acme Inc',
        ]);
        $ownerToken = $res->json('data.token');
        $orgId = $res->json('data.organization.id');
        $workspaceId = $res->json('data.workspace.id');

        // Upgrade org to Growth plan so max_members limit allows multiple members
        $growthPlan = Plan::where('slug', 'growth')->firstOrFail();
        Organization::findOrFail($orgId)->subscription->update([
            'plan_id' => $growthPlan->id,
        ]);

        // 2. Create a Viewer user in this organization
        $viewer = User::create([
            'name' => 'Viewer User',
            'email' => 'viewer@acme.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $orgId,
            'current_workspace_id' => $workspaceId,
            'status' => 'active',
        ]);

        OrganizationMember::create([
            'organization_id' => $orgId,
            'user_id' => $viewer->id,
            'role' => 'viewer',
        ]);

        WorkspaceMember::create([
            'workspace_id' => $workspaceId,
            'user_id' => $viewer->id,
            'role' => 'viewer',
        ]);

        $viewerToken = $viewer->createToken('viewer_token')->plainTextToken;

        // 3. Viewer attempts to invite someone -> Must fail (403)
        $viewerInvite = $this->withHeaders([
            'Authorization' => "Bearer {$viewerToken}",
            'X-Workspace-Id' => $workspaceId,
        ])->postJson('/api/v1/organization/members/invite', [
            'email' => 'hacked@acme.com',
            'role' => 'admin',
        ]);

        $viewerInvite->assertStatus(403);

        // Reset auth guard between test calls
        auth('sanctum')->forgetUser();

        // 4. Owner invites an editor -> Must succeed (201)
        $ownerInvite = $this->withHeaders([
            'Authorization' => "Bearer {$ownerToken}",
            'X-Workspace-Id' => $workspaceId,
        ])->postJson('/api/v1/organization/members/invite', [
            'email' => 'editor@acme.com',
            'role' => 'editor',
        ]);

        $ownerInvite->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'email' => 'editor@acme.com',
                    'role' => 'editor',
                ],
            ]);
    }
}
