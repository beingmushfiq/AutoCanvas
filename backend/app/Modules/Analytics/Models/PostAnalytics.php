<?php

namespace App\Modules\Analytics\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\ContentStrategy\Models\ContentPillar;
use App\Modules\Organization\Models\Organization;
use App\Modules\Publishing\Models\PublishingDispatch;
use App\Modules\SocialConnectors\Models\SocialAccount;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PostAnalytics extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $table = 'post_analytics';

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'content_item_id',
        'content_variant_id',
        'content_pillar_id',
        'social_account_id',
        'publishing_dispatch_id',
        'platform',
        'platform_post_id',
        'likes_count',
        'comments_count',
        'shares_count',
        'clicks_count',
        'impressions_count',
        'reach_count',
        'engagement_rate',
        'published_at',
        'last_polled_at',
        'raw_metrics',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'last_polled_at' => 'datetime',
            'likes_count' => 'integer',
            'comments_count' => 'integer',
            'shares_count' => 'integer',
            'clicks_count' => 'integer',
            'impressions_count' => 'integer',
            'reach_count' => 'integer',
            'engagement_rate' => 'float',
            'raw_metrics' => 'array',
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

    public function contentItem(): BelongsTo
    {
        return $this->belongsTo(ContentItem::class);
    }

    public function contentVariant(): BelongsTo
    {
        return $this->belongsTo(ContentVariant::class);
    }

    public function contentPillar(): BelongsTo
    {
        return $this->belongsTo(ContentPillar::class);
    }

    public function socialAccount(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class);
    }

    public function publishingDispatch(): BelongsTo
    {
        return $this->belongsTo(PublishingDispatch::class);
    }

    /**
     * Recompute engagement rate based on total engagements and impressions.
     */
    public function updateEngagementRate(): void
    {
        $engagements = $this->likes_count + $this->comments_count + $this->shares_count + $this->clicks_count;
        $impressions = max(1, $this->impressions_count);
        $this->engagement_rate = round(($engagements / $impressions) * 100, 4);
    }
}

