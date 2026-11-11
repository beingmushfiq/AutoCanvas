<?php

namespace App\Models;

use App\Core\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory, HasUlid;

    protected $fillable = [
        'name',
        'display_name',
        'scope',
        'is_system_preset',
    ];

    protected function casts(): array
    {
        return [
            'is_system_preset' => 'boolean',
        ];
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id');
    }

    public function userRoles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles', 'role_id', 'user_id')
            ->withPivot('organization_id')
            ->withTimestamps();
    }

    /**
     * Determine if this role has a specific permission.
     */
    public function hasPermission(string $permissionName): bool
    {
        return $this->permissions()->where('permissions.name', $permissionName)->exists();
    }
}

