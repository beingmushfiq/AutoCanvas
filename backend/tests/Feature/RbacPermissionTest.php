<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RbacPermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        $this->seed(RbacSeeder::class);

        // Register a temporary test route guarded by the 'permission' middleware
        Route::middleware(['auth:sanctum', 'tenant', 'permission:organization.members.invite'])
            ->get('/api/v1/test/guarded-invite-action', function () {
                return response()->json(['success' => true, 'message' => 'Action allowed']);
            });
    }

    public function test_system_permissions_granted_to_superadmin_and_denied_to_normal_users(): void
    {
        $admin = User::create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@autocanvas.io',
            'password' => bcrypt('password123'),
            'is_platform_admin' => true,
            'status' => 'active',
        ]);

        $normalUser = User::create([
            'name' => 'Regular User',
            'email' => 'user@acme.com',
            'password' => bcrypt('password123'),
            'is_platform_admin' => false,
            'status' => 'active',
        ]);

        $this->assertTrue($admin->hasSystemPermission('system.metrics.view'));
        $this->assertTrue($admin->hasSystemPermission('system.organizations.manage'));
        $this->assertTrue($admin->hasSystemPermission('system.emergency.circuit_breaker'));

        $this->assertFalse($normalUser->hasSystemPermission('system.metrics.view'));
        $this->assertFalse($normalUser->hasSystemPermission('system.organizations.manage'));
    }

    public function test_org_owner_role_grants_tenant_permissions(): void
    {
        $org = Organization::create([
            'name' => 'Acme Corp',
            'slug' => 'acme-corp',
            'billing_email' => 'billing@acme.com',
            'status' => 'active',
        ]);

        $owner = User::create([
            'name' => 'Acme Owner',
            'email' => 'owner@acme.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $org->id,
            'status' => 'active',
        ]);

        OrganizationMember::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role' => 'owner',
        ]);

        $owner->assignRole('org_owner', $org->id);

        $this->assertTrue($owner->hasPermission('organization.members.invite', $org->id));
        $this->assertTrue($owner->hasPermission('brand.create', $org->id));
        $this->assertTrue($owner->hasPermission('content.approve', $org->id));
        $this->assertTrue($owner->hasPermission('publishing.publish_now', $org->id));
    }

    public function test_cross_tenant_permission_isolation(): void
    {
        $orgA = Organization::create([
            'name' => 'Org Alpha',
            'slug' => 'org-alpha',
            'billing_email' => 'alpha@example.com',
            'status' => 'active',
        ]);

        $orgB = Organization::create([
            'name' => 'Org Beta',
            'slug' => 'org-beta',
            'billing_email' => 'beta@example.com',
            'status' => 'active',
        ]);

        $user = User::create([
            'name' => 'Dual Member',
            'email' => 'dual@example.com',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        // User is Owner in Org Alpha
        OrganizationMember::create([
            'organization_id' => $orgA->id,
            'user_id' => $user->id,
            'role' => 'owner',
        ]);
        $user->assignRole('org_owner', $orgA->id);

        // User is Viewer in Org Beta
        OrganizationMember::create([
            'organization_id' => $orgB->id,
            'user_id' => $user->id,
            'role' => 'viewer',
        ]);
        $user->assignRole('org_viewer', $orgB->id);

        // Assert permissions in Org Alpha
        $this->assertTrue($user->hasPermission('organization.members.invite', $orgA->id));
        $this->assertTrue($user->hasPermission('brand.create', $orgA->id));

        // Assert permissions in Org Beta (cannot invite or create brands, can only view calendar)
        $this->assertFalse($user->hasPermission('organization.members.invite', $orgB->id));
        $this->assertFalse($user->hasPermission('brand.create', $orgB->id));
        $this->assertTrue($user->hasPermission('publishing.calendar.view', $orgB->id));
    }

    public function test_require_permission_middleware_blocks_unauthorized_action(): void
    {
        $org = Organization::create([
            'name' => 'Security Org',
            'slug' => 'security-org',
            'billing_email' => 'sec@example.com',
            'status' => 'active',
        ]);

        $workspace = Workspace::create([
            'organization_id' => $org->id,
            'name' => 'Main Workspace',
            'slug' => 'main',
            'is_default' => true,
        ]);

        $viewer = User::create([
            'name' => 'Viewer User',
            'email' => 'viewer@sec.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $org->id,
            'current_workspace_id' => $workspace->id,
            'status' => 'active',
        ]);

        OrganizationMember::create([
            'organization_id' => $org->id,
            'user_id' => $viewer->id,
            'role' => 'viewer',
        ]);
        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $viewer->id,
            'role' => 'viewer',
        ]);
        $viewer->assignRole('org_viewer', $org->id);

        $viewerToken = $viewer->createToken('viewer_token')->plainTextToken;

        // Viewer attempts guarded route -> Expect 403 PERMISSION_DENIED
        $res = $this->withHeaders([
            'Authorization' => "Bearer {$viewerToken}",
            'X-Workspace-Id' => $workspace->id,
        ])->getJson('/api/v1/test/guarded-invite-action');

        $res->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'PERMISSION_DENIED',
                ],
            ]);

        // Reset auth guard between test calls
        auth('sanctum')->forgetUser();

        // Owner attempts guarded route -> Expect 200 OK
        $owner = User::create([
            'name' => 'Owner User',
            'email' => 'owner@sec.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $org->id,
            'current_workspace_id' => $workspace->id,
            'status' => 'active',
        ]);

        OrganizationMember::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role' => 'owner',
        ]);
        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $owner->id,
            'role' => 'owner',
        ]);
        $owner->assignRole('org_owner', $org->id);

        $ownerToken = $owner->createToken('owner_token')->plainTextToken;

        $ownerRes = $this->withHeaders([
            'Authorization' => "Bearer {$ownerToken}",
            'X-Workspace-Id' => $workspace->id,
        ])->getJson('/api/v1/test/guarded-invite-action');

        $ownerRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Action allowed',
            ]);
    }

    public function test_custom_role_creation_and_dynamic_permission_grant(): void
    {
        $org = Organization::create([
            'name' => 'Custom Role Org',
            'slug' => 'custom-role-org',
            'billing_email' => 'custom@example.com',
            'status' => 'active',
        ]);

        $customRole = Role::create([
            'name' => 'social_curator',
            'display_name' => 'Social Curator',
            'scope' => 'organization',
            'is_system_preset' => false,
        ]);

        $schedulePerm = Permission::where('name', 'publishing.schedule')->firstOrFail();
        $calendarPerm = Permission::where('name', 'publishing.calendar.view')->firstOrFail();

        $customRole->permissions()->attach([$schedulePerm->id, $calendarPerm->id]);

        $user = User::create([
            'name' => 'Curator User',
            'email' => 'curator@example.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $org->id,
            'status' => 'active',
        ]);

        OrganizationMember::create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role' => 'viewer',
        ]);

        $user->assignRole('social_curator', $org->id);

        $this->assertTrue($user->hasPermission('publishing.schedule', $org->id));
        $this->assertTrue($user->hasPermission('publishing.calendar.view', $org->id));
        $this->assertFalse($user->hasPermission('brand.create', $org->id));
        $this->assertFalse($user->hasPermission('organization.billing.manage', $org->id));
    }
}
