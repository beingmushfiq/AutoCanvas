<?php

namespace App\Modules\Research\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Organization\Models\Organization;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeedArticle extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'rss_feed_id',
        'title',
        'url',
        'url_hash',
        'author',
        'summary',
        'content',
        'published_at',
        'relevance_score',
        'topics',
        'is_saved',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'relevance_score' => 'integer',
            'topics' => 'array',
            'is_saved' => 'boolean',
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

    public function feed(): BelongsTo
    {
        return $this->belongsTo(RssFeed::class, 'rss_feed_id');
    }

    public function opportunities(): HasMany
    {
        return $this->hasMany(ContentOpportunity::class);
    }
}
