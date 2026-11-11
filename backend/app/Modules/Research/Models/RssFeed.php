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
use Illuminate\Database\Eloquent\SoftDeletes;

class RssFeed extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'name',
        'url',
        'category',
        'fetch_frequency_minutes',
        'last_fetched_at',
        'status',
        'error_count',
        'last_error',
        'etag',
        'last_modified_header',
    ];

    protected function casts(): array
    {
        return [
            'last_fetched_at' => 'datetime',
            'fetch_frequency_minutes' => 'integer',
            'error_count' => 'integer',
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

    public function articles(): HasMany
    {
        return $this->hasMany(FeedArticle::class);
    }
}

