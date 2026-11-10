<?php

namespace App\Modules\Research\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use App\Modules\Organization\Models\Organization;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrendSignal extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'topic',
        'description',
        'source_type',
        'signal_strength',
        'sample_urls',
        'status',
        'detected_at',
    ];

    protected function casts(): array
    {
        return [
            'signal_strength' => 'integer',
            'sample_urls' => 'array',
            'detected_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function opportunities(): HasMany
    {
        return $this->hasMany(ContentOpportunity::class);
    }
}
