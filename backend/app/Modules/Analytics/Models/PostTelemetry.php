<?php

namespace App\Modules\Analytics\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Organization\Models\Organization;
use App\Modules\Publishing\Models\ChannelDispatch;
use App\Modules\Publishing\Models\PublishingDispatch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostTelemetry extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $table = 'post_telemetries';

    protected $fillable = [
        'organization_id',
        'dispatch_id',
        'channel_dispatch_id',
        'channel',
        'impressions',
        'engagements',
        'likes',
        'comments',
        'shares',
        'clicks',
        'engagement_rate',
        'is_winning_pattern',
        'checkpoint',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'impressions' => 'integer',
            'engagements' => 'integer',
            'likes' => 'integer',
            'comments' => 'integer',
            'shares' => 'integer',
            'clicks' => 'integer',
            'engagement_rate' => 'decimal:4',
            'is_winning_pattern' => 'boolean',
            'recorded_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function dispatch(): BelongsTo
    {
        return $this->belongsTo(PublishingDispatch::class, 'dispatch_id');
    }

    public function channelDispatch(): BelongsTo
    {
        return $this->belongsTo(ChannelDispatch::class, 'channel_dispatch_id');
    }
}

