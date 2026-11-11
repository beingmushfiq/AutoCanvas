<?php

namespace App\Modules\ControlPlane\Services;

use App\Models\User;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use App\Modules\Organization\Models\AuditLog;
use App\Modules\Organization\Models\Organization;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TenantGovernanceService
{
    /**
     * List all organizations with search and status filtering.
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

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Inspect single organization with telemetry and member roster.
     */
    public function getOrganization(string $orgId): Organization
    {
        return Organization::withoutGlobalScopes()
            ->with(['members.user', 'workspaces', 'brands', 'subscription.plan'])
            ->withCount(['members', 'workspaces', 'brands'])
            ->findOrFail($orgId);
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

            // Revoke active personal access tokens for all members of this organization
            $memberUserIds = $org->members()->pluck('user_id');
            DB::table('personal_access_tokens')
                ->where('tokenable_type', User::class)
                ->whereIn('tokenable_id', $memberUserIds)
                ->delete();

            // Record in system_change_logs
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
}

