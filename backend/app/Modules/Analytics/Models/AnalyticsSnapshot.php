<?php

namespace App\Modules\Analytics\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use App\Modules\Organization\Models\Organization;
use App\Modules\SocialConnectors\Models\SocialAccount;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AnalyticsSnapshot extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $table = 'analytics_snapshots';

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'social_account_id',
        'platform',
        'snapshot_date',
        'impressions',
        'reach',
        'engagements',
        'clicks',
        'video_views',
        'net_follower_change',
        'engagement_rate',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'snapshot_date' => 'string',
            'impressions' => 'integer',
            'reach' => 'integer',
            'engagements' => 'integer',
            'clicks' => 'integer',
            'video_views' => 'integer',
            'net_follower_change' => 'integer',
            'engagement_rate' => 'float',
            'metadata' => 'array',
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

    public function socialAccount(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class);
    }
}
