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

class DiscoveredSource extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $table = 'discovered_sources';

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'source_type',
        'source_name',
        'source_url',
        'feed_url',
        'relevance_score',
        'authority_score',
        'last_scoured_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'relevance_score' => 'integer',
            'authority_score' => 'integer',
            'last_scoured_at' => 'datetime',
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
}

