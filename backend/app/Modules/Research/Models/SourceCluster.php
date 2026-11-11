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

class SourceCluster extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $table = 'source_clusters';

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'primary_entity',
        'cluster_title',
        'summary',
        'article_count',
        'momentum_score',
        'source_domains',
        'has_consensus',
        'first_seen_at',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'article_count' => 'integer',
            'momentum_score' => 'integer',
            'source_domains' => 'array',
            'has_consensus' => 'boolean',
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
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

