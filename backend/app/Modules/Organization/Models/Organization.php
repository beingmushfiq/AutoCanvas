<?php

namespace App\Modules\Organization\Models;

use App\Core\Concerns\HasUlid;
use App\Models\User;
use App\Modules\Billing\Models\Subscription;
use App\Modules\Brand\Models\Brand;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model
{
    use HasFactory, HasUlid, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'timezone',
        'billing_email',
        'status',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    public function workspaces(): HasMany
    {
        return $this->hasMany(Workspace::class);
    }

    public function brands(): HasMany
    {
        return $this->hasMany(Brand::class);
    }

    public function defaultWorkspace(): HasOne
    {
        return $this->hasOne(Workspace::class)->where('is_default', true);
    }

    public function members(): HasMany
    {
        return $this->hasMany(OrganizationMember::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(\App\Modules\Billing\Models\Invoice::class);
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(\App\Modules\Billing\Models\PaymentTransaction::class);
    }

    public function getRoleOf(User $user): ?string
    {
        $member = $this->members()->where('user_id', $user->id)->first();

        return $member?->role;
    }
}
