<?php

namespace App\Modules\Publishing\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Organization\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PublishingJob extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'organization_id',
        'idempotency_key',
        'content',
        'destination',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'json',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(PublishingAttempt::class);
    }
}

