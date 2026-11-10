<?php

namespace App\Modules\Research\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentStrategy\Models\ContentPillar;
use App\Modules\Organization\Models\Organization;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContentOpportunity extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'content_pillar_id',
        'feed_article_id',
        'trend_signal_id',
        'title',
        'angle',
        'why_it_matters',
        'recommended_channels',
        'urgency_score',
        'freshness_score',
        'overall_opportunity_score',
        'status',
        'converted_content_item_id',
    ];

    protected function casts(): array
    {
        return [
            'recommended_channels' => 'array',
            'urgency_score' => 'integer',
            'freshness_score' => 'integer',
            'overall_opportunity_score' => 'integer',
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

    public function pillar(): BelongsTo
    {
        return $this->belongsTo(ContentPillar::class, 'content_pillar_id');
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(FeedArticle::class, 'feed_article_id');
    }

    public function trendSignal(): BelongsTo
    {
        return $this->belongsTo(TrendSignal::class, 'trend_signal_id');
    }

    public function convertedContentItem(): BelongsTo
    {
        return $this->belongsTo(ContentItem::class, 'converted_content_item_id');
    }
}
