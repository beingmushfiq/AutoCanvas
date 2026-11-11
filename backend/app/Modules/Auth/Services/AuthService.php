<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use App\Modules\Billing\Models\Plan;
use App\Modules\Billing\Models\Subscription;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Organization\Services\AuditLogger;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Register a new user, create their initial organization and default workspace.
     */
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            // 1. Create User
            $user = User::create([
                'name' => $data['name'],
                'email' => strtolower(trim($data['email'])),
                'password' => Hash::make($data['password']),
                'status' => 'active',
            ]);

            // 2. Generate Organization Slug
            $orgName = $data['organization_name'] ?? ($data['name']."'s Organization");
            $baseSlug = Str::slug($orgName);
            $slug = $baseSlug;
            $counter = 1;
            while (Organization::where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }

            // 3. Create Organization
            $organization = Organization::create([
                'name' => $orgName,
                'slug' => $slug,
                'timezone' => $data['timezone'] ?? 'UTC',
                'billing_email' => $user->email,
                'status' => 'active',
            ]);

            // 4. Create Default Workspace
            $workspace = Workspace::create([
                'organization_id' => $organization->id,
                'name' => 'Default Workspace',
                'slug' => 'default',
                'is_default' => true,
            ]);

            // 5. Add User as Owner
            OrganizationMember::create([
                'organization_id' => $organization->id,
                'user_id' => $user->id,
                'role' => 'owner',
            ]);

            WorkspaceMember::create([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'role' => 'owner',
            ]);

            // Assign RBAC Role if preset exists
            if (\App\Models\Role::where('name', 'org_owner')->exists()) {
                $user->assignRole('org_owner', $organization->id);
            }

            // 6. Update User's Active Context
            $user->update([
                'current_organization_id' => $organization->id,
                'current_workspace_id' => $workspace->id,
            ]);

            // 7. Attach Starter Plan Subscription
            $starterPlan = Plan::where('slug', 'starter')->first();
            if ($starterPlan) {
                Subscription::create([
                    'organization_id' => $organization->id,
                    'plan_id' => $starterPlan->id,
                    'status' => 'active',
                    'current_period_start' => now(),
                    'current_period_end' => now()->addMonth(),
                ]);
            }

            // 8. Audit Log
            AuditLogger::log('user.registered', $user, null, ['email' => $user->email], $organization->id, $workspace->id);
            AuditLogger::log('organization.created', $organization, null, ['name' => $organization->name], $organization->id, $workspace->id);

            // 9. Generate Sanctum Token
            $token = $user->createToken('auth_token')->plainTextToken;

            return [
                'user' => $user,
                'organization' => $organization,
                'workspace' => $workspace,
                'token' => $token,
            ];
        });
    }

    /**
     * Authenticate user credentials and return Sanctum token.
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', strtolower(trim($email)))->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended. Please contact support.'],
            ]);
        }

        // Ensure user has an active organization and workspace set
        if (! $user->current_organization_id || ! $user->current_workspace_id) {
            $firstOrg = $user->organizations()->first();
            if ($firstOrg) {
                $firstWs = $firstOrg->workspaces()->first();
                $user->update([
                    'current_organization_id' => $firstOrg->id,
                    'current_workspace_id' => $firstWs?->id,
                ]);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
            'active_organization' => $user->activeOrganization,
            'active_workspace' => $user->activeWorkspace,
        ];
    }

    /**
     * Revoke active token.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    /**
     * Switch user's active workspace and organization context.
     */
    public function switchWorkspace(User $user, string $workspaceId): Workspace
    {
        $workspace = Workspace::withoutGlobalScopes()
            ->where('id', $workspaceId)
            ->firstOrFail();

        if (! $user->isMemberOfOrganization($workspace->organization_id) && ! $user->is_platform_admin) {
            abort(403, 'You do not have access to this workspace.');
        }

        $user->update([
            'current_organization_id' => $workspace->organization_id,
            'current_workspace_id' => $workspace->id,
        ]);

        return $workspace;
    }
}
