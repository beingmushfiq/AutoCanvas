<?php

namespace App\Models;

use App\Core\Concerns\HasUlid;
use App\Core\Security\PermissionRegistry;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUlid, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'google_id',
        'email_verified_at',
        'password',
        'current_organization_id',
        'current_workspace_id',
        'avatar_url',
        'status',
        'is_platform_admin',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_platform_admin' => 'boolean',
        ];
    }

    public function activeOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'current_organization_id');
    }

    public function activeWorkspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'current_workspace_id');
    }

    public function organizationMemberships(): HasMany
    {
        return $this->hasMany(OrganizationMember::class);
    }

    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function workspaceMemberships(): HasMany
    {
        return $this->hasMany(WorkspaceMember::class);
    }

    public function workspaces(): BelongsToMany
    {
        return $this->belongsToMany(Workspace::class, 'workspace_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function userRoles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id')
            ->withPivot('organization_id')
            ->withTimestamps();
    }

    public function isMemberOfOrganization(string $organizationId): bool
    {
        return $this->organizations()->where('organizations.id', $organizationId)->exists();
    }

    public function isMemberOfWorkspace(string $workspaceId): bool
    {
        return $this->workspaces()->where('workspaces.id', $workspaceId)->exists();
    }

    /**
     * Check if user has a specific permission in the specified or current tenant scope.
     */
    public function hasPermission(string $permission, ?string $organizationId = null): bool
    {
        return app(PermissionRegistry::class)->hasPermission($this, $permission, $organizationId);
    }

    /**
     * Check if user has a platform system-level permission.
     */
    public function hasSystemPermission(string $permission): bool
    {
        return app(PermissionRegistry::class)->hasPermission($this, $permission, null);
    }

    /**
     * Assign a named role to this user.
     */
    public function assignRole(string $roleName, ?string $organizationId = null): UserRole
    {
        return app(PermissionRegistry::class)->assignRole($this, $roleName, $organizationId);
    }

    /**
     * Revoke a named role from this user.
     */
    public function revokeRole(string $roleName, ?string $organizationId = null): bool
    {
        return app(PermissionRegistry::class)->revokeRole($this, $roleName, $organizationId);
    }
}
