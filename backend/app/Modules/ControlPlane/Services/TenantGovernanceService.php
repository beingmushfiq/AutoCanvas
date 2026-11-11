<?php

namespace App\Modules\ControlPlane\Services;

use App\Models\Role;
use App\Models\User;
use App\Modules\Billing\Models\Plan;
use App\Modules\Billing\Models\Subscription;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use App\Modules\Organization\Models\AuditLog;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TenantGovernanceService
{
    /**
     * List all organizations with search, plan, and status filtering.
     */
    public function listOrganizations(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Organization::withoutGlobalScopes()
            ->with(['subscription.plan'])
            ->withCount(['members', 'workspaces', 'brands']);

        if (! empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('slug', 'like', $search)
                  ->orWhere('billing_email', 'like', $search);
            });
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['plan_id'])) {
            $query->whereHas('subscription', function ($q) use ($filters) {
                $q->where('plan_id', $filters['plan_id']);
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Inspect single organization with telemetry, workspaces, and member roster.
     */
    public function getOrganization(string $orgId): Organization
    {
        return Organization::withoutGlobalScopes()
            ->with([
                'members.user',
                'workspaces' => fn ($q) => $q->withoutGlobalScopes()->withCount('brands'),
                'brands' => fn ($q) => $q->withoutGlobalScopes(),
                'subscription.plan',
            ])
            ->withCount(['members', 'workspaces', 'brands'])
            ->findOrFail($orgId);
    }

    /**
     * Register a new tenant organization with atomic owner user, workspace, and subscription.
     */
    public function registerTenant(array $data, User $admin): array
    {
        return DB::transaction(function () use ($data, $admin) {
            // 1. Resolve or Create Owner User
            $ownerEmail = trim(strtolower($data['owner_email']));
            $owner = User::where('email', $ownerEmail)->first();

            if (! $owner) {
                $password = ! empty($data['owner_password']) ? $data['owner_password'] : Str::random(16);
                $owner = User::create([
                    'id' => (string) Str::ulid(),
                    'name' => trim($data['owner_name'] ?? 'Organization Owner'),
                    'email' => $ownerEmail,
                    'password' => Hash::make($password),
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]);
            }

            // 2. Resolve Unique Slug
            $orgName = trim($data['name']);
            $baseSlug = ! empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($orgName);
            $slug = $baseSlug;
            $counter = 1;
            while (Organization::withoutGlobalScopes()->where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }

            // 3. Create Organization
            $org = Organization::create([
                'name' => $orgName,
                'slug' => $slug,
                'timezone' => $data['timezone'] ?? 'UTC',
                'billing_email' => $data['billing_email'] ?? $ownerEmail,
                'status' => 'active',
                'settings' => [
                    'provisioned_by_admin_id' => $admin->id,
                    'send_invite' => ! empty($data['send_invite']),
                ],
            ]);

            // 4. Create Default Workspace
            $workspace = Workspace::create([
                'organization_id' => $org->id,
                'name' => 'Default Workspace',
                'slug' => 'default',
                'is_default' => true,
            ]);

            // 5. Bind User to Organization & Workspace as Owner
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

            // Assign org_owner RBAC role if available
            $orgOwnerRole = Role::where('name', 'org_owner')->first();
            if ($orgOwnerRole) {
                $owner->assignRole('org_owner', $org->id);
            }

            // Set current context for owner if unset
            if (! $owner->current_organization_id) {
                $owner->update([
                    'current_organization_id' => $org->id,
                    'current_workspace_id' => $workspace->id,
                ]);
            }

            // 6. Attach Subscription Plan
            $planId = $data['plan_id'] ?? null;
            $plan = $planId ? Plan::find($planId) : Plan::where('slug', 'pro')->orWhere('slug', 'starter')->first();

            if ($plan) {
                Subscription::create([
                    'organization_id' => $org->id,
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'current_period_start' => now(),
                    'current_period_end' => now()->addMonth(),
                ]);
            }

            // 7. Write Immutable Audit Records
            SystemChangeLog::create([
                'user_id' => $admin->id,
                'entity_type' => 'organization',
                'entity_id' => $org->id,
                'action' => 'organization.provisioned',
                'old_values' => null,
                'new_values' => [
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'billing_email' => $org->billing_email,
                    'owner_email' => $owner->email,
                    'plan_id' => $plan?->id,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            AuditLog::create([
                'organization_id' => $org->id,
                'user_id' => $admin->id,
                'action' => 'organization.provisioned_by_platform_admin',
                'entity_type' => Organization::class,
                'entity_id' => $org->id,
                'old_values' => null,
                'new_values' => [
                    'name' => $org->name,
                    'owner_id' => $owner->id,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return [
                'organization' => $this->getOrganization($org->id),
                'owner' => [
                    'id' => $owner->id,
                    'name' => $owner->name,
                    'email' => $owner->email,
                ],
                'workspace' => $workspace,
            ];
        });
    }

    /**
     * Update tenant metadata, slug, or subscription plan.
     */
    public function updateTenant(string $orgId, array $data, User $admin): Organization
    {
        return DB::transaction(function () use ($orgId, $data, $admin) {
            $org = Organization::withoutGlobalScopes()->findOrFail($orgId);
            $oldValues = $org->only(['name', 'slug', 'billing_email', 'timezone']);

            $updateData = [];
            if (isset($data['name'])) $updateData['name'] = trim($data['name']);
            if (isset($data['slug'])) {
                $newSlug = Str::slug($data['slug']);
                if ($newSlug !== $org->slug) {
                    $exists = Organization::withoutGlobalScopes()->where('slug', $newSlug)->where('id', '!=', $orgId)->exists();
                    if (! $exists) {
                        $updateData['slug'] = $newSlug;
                    }
                }
            }
            if (isset($data['billing_email'])) $updateData['billing_email'] = trim($data['billing_email']);
            if (isset($data['timezone'])) $updateData['timezone'] = $data['timezone'];

            if (! empty($updateData)) {
                $org->update($updateData);
            }

            // Update Subscription Plan if requested
            if (! empty($data['plan_id'])) {
                $plan = Plan::find($data['plan_id']);
                if ($plan) {
                    $sub = Subscription::where('organization_id', $org->id)->first();
                    if ($sub) {
                        $sub->update(['plan_id' => $plan->id]);
                    } else {
                        Subscription::create([
                            'organization_id' => $org->id,
                            'plan_id' => $plan->id,
                            'status' => 'active',
                            'current_period_start' => now(),
                            'current_period_end' => now()->addMonth(),
                        ]);
                    }
                }
            }

            SystemChangeLog::create([
                'user_id' => $admin->id,
                'entity_type' => 'organization',
                'entity_id' => $org->id,
                'action' => 'organization.updated',
                'old_values' => $oldValues,
                'new_values' => $org->fresh()->only(['name', 'slug', 'billing_email', 'timezone']),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return $this->getOrganization($org->id);
        });
    }

    /**
     * Soft-delete an organization and revoke active tokens.
     */
    public function deleteTenant(string $orgId, User $admin): bool
    {
        return DB::transaction(function () use ($orgId, $admin) {
            $org = Organization::withoutGlobalScopes()->findOrFail($orgId);

            // Revoke active personal access tokens for all non-platform-admin members
            $memberUserIds = $org->members()->where('is_platform_admin', false)->pluck('user_id');
            DB::table('personal_access_tokens')
                ->where('tokenable_type', User::class)
                ->whereIn('tokenable_id', $memberUserIds)
                ->delete();

            // Record audit log
            SystemChangeLog::create([
                'user_id' => $admin->id,
                'entity_type' => 'organization',
                'entity_id' => $org->id,
                'action' => 'organization.deleted',
                'old_values' => ['name' => $org->name, 'slug' => $org->slug],
                'new_values' => ['deleted_at' => now()->toIso8601String()],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return (bool) $org->delete();
        });
    }

    /**
     * Suspend an organization, revoke user tokens, and record change log.
     */
    public function suspendOrganization(string $orgId, User $admin, ?string $reason = null): Organization
    {
        return DB::transaction(function () use ($orgId, $admin, $reason) {
            $org = Organization::withoutGlobalScopes()->findOrFail($orgId);
            $oldStatus = $org->status;

            $org->update(['status' => 'suspended']);

            // Revoke active personal access tokens for all non-platform-admin members of this organization
            $memberUserIds = $org->members()->where('is_platform_admin', false)->pluck('user_id');
            DB::table('personal_access_tokens')
                ->where('tokenable_type', User::class)
                ->whereIn('tokenable_id', $memberUserIds)
                ->delete();

            SystemChangeLog::create([
                'user_id' => $admin->id,
                'entity_type' => 'organization',
                'entity_id' => $org->id,
                'action' => 'organization.suspended',
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 'suspended', 'reason' => $reason],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            AuditLog::create([
                'organization_id' => $org->id,
                'user_id' => $admin->id,
                'action' => 'organization.suspended_by_platform_admin',
                'entity_type' => Organization::class,
                'entity_id' => $org->id,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 'suspended', 'reason' => $reason],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return $org;
        });
    }

    /**
     * Activate a suspended or delinquent organization.
     */
    public function activateOrganization(string $orgId, User $admin): Organization
    {
        return DB::transaction(function () use ($orgId, $admin) {
            $org = Organization::withoutGlobalScopes()->findOrFail($orgId);
            $oldStatus = $org->status;

            $org->update(['status' => 'active']);

            SystemChangeLog::create([
                'user_id' => $admin->id,
                'entity_type' => 'organization',
                'entity_id' => $org->id,
                'action' => 'organization.activated',
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 'active'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            AuditLog::create([
                'organization_id' => $org->id,
                'user_id' => $admin->id,
                'action' => 'organization.activated_by_platform_admin',
                'entity_type' => Organization::class,
                'entity_id' => $org->id,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 'active'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return $org;
        });
    }

    /**
     * Issue a 15-minute scoped, read-only audit impersonation token.
     */
    public function issueImpersonationToken(string $orgId, User $admin): array
    {
        $org = Organization::withoutGlobalScopes()->findOrFail($orgId);
        $owner = $org->users()->wherePivot('role', 'owner')->first() ?? $admin;

        $token = $owner->createToken('impersonation_token', ['tenant:read-only'], now()->addMinutes(15))->plainTextToken;

        SystemChangeLog::create([
            'user_id' => $admin->id,
            'entity_type' => 'organization',
            'entity_id' => $org->id,
            'action' => 'organization.impersonated',
            'old_values' => null,
            'new_values' => ['target_user_id' => $owner->id, 'expires_in_minutes' => 15],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);

        return [
            'token' => $token,
            'expires_at' => now()->addMinutes(15)->toIso8601String(),
            'impersonated_organization' => [
                'id' => $org->id,
                'name' => $org->name,
                'slug' => $org->slug,
            ],
        ];
    }

    /**
     * List all subscription plans available for tenant assignment.
     */
    public function listPlans(): Collection
    {
        return Plan::where('is_active', true)->orderBy('price_monthly', 'asc')->get();
    }

    /**
     * List all workspaces belonging to an organization.
     */
    public function listWorkspaces(string $orgId): Collection
    {
        return Workspace::withoutGlobalScopes()
            ->where('organization_id', $orgId)
            ->withCount(['brands'])
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Provision an additional workspace for an organization.
     */
    public function createWorkspace(string $orgId, array $data, User $admin): Workspace
    {
        $org = Organization::withoutGlobalScopes()->findOrFail($orgId);
        $name = trim($data['name']);
        $baseSlug = ! empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while (Workspace::withoutGlobalScopes()->where('organization_id', $orgId)->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $workspace = Workspace::create([
            'organization_id' => $org->id,
            'name' => $name,
            'slug' => $slug,
            'is_default' => false,
        ]);

        SystemChangeLog::create([
            'user_id' => $admin->id,
            'entity_type' => 'workspace',
            'entity_id' => $workspace->id,
            'action' => 'workspace.created_by_platform_admin',
            'old_values' => null,
            'new_values' => ['organization_id' => $org->id, 'name' => $workspace->name],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);

        return $workspace;
    }
}
