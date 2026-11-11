<?php

namespace App\Core\Security;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;
use App\Modules\Organization\Models\OrganizationMember;

class PermissionRegistry
{
    /**
     * In-memory request cache for resolved user permissions.
     */
    protected array $resolvedCache = [];

    /**
     * Resolve all effective permissions for a user within an organization or system context.
     *
     * @return array<string> List of granted permission names
     */
    public function getPermissionsForUser(User $user, ?string $organizationId = null): array
    {
        $cacheKey = "{$user->id}:" . ($organizationId ?? 'system');

        if (isset($this->resolvedCache[$cacheKey])) {
            return $this->resolvedCache[$cacheKey];
        }

        $permissions = [];

        // 1. Superadmin special handling: Platform admins get all system permissions
        if ($user->is_platform_admin) {
            $systemPerms = Permission::where('category', 'system')->pluck('name')->all();
            $permissions = array_merge($permissions, $systemPerms);
        }

        // 2. Query explicit roles from user_roles table
        $userRolesQuery = UserRole::with('role.permissions')
            ->where('user_id', $user->id);

        if ($organizationId) {
            $userRolesQuery->where(function ($q) use ($organizationId) {
                $q->where('organization_id', $organizationId)
                  ->orWhereNull('organization_id');
            });
        } else {
            $userRolesQuery->whereNull('organization_id');
        }

        $userRoles = $userRolesQuery->get();

        foreach ($userRoles as $ur) {
            if ($ur->role) {
                foreach ($ur->role->permissions as $perm) {
                    $permissions[] = $perm->name;
                }
            }
        }

        // 3. Backward Compatibility & Graceful Fallback:
        // If organization context provided and user has no explicit user_roles, map legacy OrganizationMember role
        if ($organizationId && empty($permissions)) {
            $member = OrganizationMember::where('organization_id', $organizationId)
                ->where('user_id', $user->id)
                ->first();

            if ($member) {
                $mappedPermissions = $this->mapLegacyRoleToPermissions($member->role);
                $permissions = array_merge($permissions, $mappedPermissions);
            }
        }

        $unique = array_values(array_unique($permissions));
        $this->resolvedCache[$cacheKey] = $unique;

        return $unique;
    }

    /**
     * Check if user possesses a specific permission in the specified or current tenant scope.
     */
    public function hasPermission(User $user, string $permission, ?string $organizationId = null): bool
    {
        // 1. If checking a system.* permission, verify system admin capability
        if (str_starts_with($permission, 'system.')) {
            if ($user->is_platform_admin) {
                return true;
            }
            $systemPerms = $this->getPermissionsForUser($user, null);
            return in_array($permission, $systemPerms, true);
        }

        // 2. Fallback to active organization context if none provided
        if (! $organizationId) {
            if (app()->has('current_organization_id')) {
                $organizationId = app('current_organization_id');
            } elseif ($user->current_organization_id) {
                $organizationId = $user->current_organization_id;
            }
        }

        $granted = $this->getPermissionsForUser($user, $organizationId);

        return in_array($permission, $granted, true);
    }

    /**
     * Assign a named role to a user within an optional organization context.
     */
    public function assignRole(User $user, string $roleName, ?string $organizationId = null): UserRole
    {
        $role = Role::where('name', $roleName)->firstOrFail();

        $userRole = UserRole::firstOrCreate([
            'user_id' => $user->id,
            'role_id' => $role->id,
            'organization_id' => $organizationId,
        ]);

        $this->clearCacheForUser($user->id);

        return $userRole;
    }

    /**
     * Revoke a named role from a user.
     */
    public function revokeRole(User $user, string $roleName, ?string $organizationId = null): bool
    {
        $role = Role::where('name', $roleName)->first();
        if (! $role) {
            return false;
        }

        $deleted = UserRole::where('user_id', $user->id)
            ->where('role_id', $role->id)
            ->where('organization_id', $organizationId)
            ->delete();

        $this->clearCacheForUser($user->id);

        return $deleted > 0;
    }

    /**
     * Clear resolution cache.
     */
    public function clearCache(): void
    {
        $this->resolvedCache = [];
    }

    /**
     * Clear cache for a specific user.
     */
    public function clearCacheForUser(string $userId): void
    {
        foreach (array_keys($this->resolvedCache) as $key) {
            if (str_starts_with($key, "{$userId}:")) {
                unset($this->resolvedCache[$key]);
            }
        }
    }

    /**
     * Map legacy OrganizationMember string roles to atomic permission sets.
     */
    protected function mapLegacyRoleToPermissions(string $legacyRole): array
    {
        return match ($legacyRole) {
            'owner' => [
                'organization.profile.update',
                'organization.members.invite',
                'organization.members.roles',
                'organization.billing.manage',
                'organization.audit.view',
                'brand.create',
                'brand.profile.edit',
                'brand.voice.edit',
                'brand.knowledge.ingest',
                'brand.discovery.run',
                'brand.delete',
                'content.pillar.manage',
                'content.campaign.manage',
                'content.draft.create',
                'content.ai.generate',
                'content.review.submit',
                'content.approve',
                'content.delete',
                'publishing.social.connect',
                'publishing.schedule',
                'publishing.publish_now',
                'publishing.cancel',
                'publishing.calendar.view',
                'community.inbox.view',
                'community.reply.post',
                'community.moderation.manage',
                'analytics.overview.view',
                'analytics.reports.export',
            ],
            'admin' => [
                'organization.profile.update',
                'organization.members.invite',
                'organization.members.roles',
                'organization.audit.view',
                'brand.create',
                'brand.profile.edit',
                'brand.voice.edit',
                'brand.knowledge.ingest',
                'brand.discovery.run',
                'content.pillar.manage',
                'content.campaign.manage',
                'content.draft.create',
                'content.ai.generate',
                'content.review.submit',
                'content.approve',
                'publishing.social.connect',
                'publishing.schedule',
                'publishing.publish_now',
                'publishing.cancel',
                'publishing.calendar.view',
                'community.inbox.view',
                'community.reply.post',
                'analytics.overview.view',
            ],
            'editor', 'manager' => [
                'brand.profile.edit',
                'brand.knowledge.ingest',
                'content.pillar.manage',
                'content.campaign.manage',
                'content.draft.create',
                'content.ai.generate',
                'content.review.submit',
                'publishing.calendar.view',
                'community.inbox.view',
                'community.reply.post',
                'analytics.overview.view',
            ],
            'viewer' => [
                'publishing.calendar.view',
                'analytics.overview.view',
            ],
            default => [
                'publishing.calendar.view',
                'analytics.overview.view',
            ],
        };
    }
}

