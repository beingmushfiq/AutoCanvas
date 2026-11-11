<?php

namespace App\Modules\Publishing\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\Organization\Models\Organization;
use App\Modules\SocialConnectors\Models\SocialAccount;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PublishingDispatch extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $table = 'publishing_dispatches';

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'content_item_id',
        'content_variant_id',
        'social_account_id',
        'idempotency_key',
        'queue_name',
        'status',
        'attempts',
        'platform_post_id',
        'platform_permalink',
        'payload_snapshot',
        'response_payload',
        'error_message',
        'error_code',
        'scheduled_at',
        'dispatched_at',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'payload_snapshot' => 'array',
            'response_payload' => 'array',
            'attempts' => 'integer',
            'scheduled_at' => 'datetime',
            'dispatched_at' => 'datetime',
            'published_at' => 'datetime',
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

    public function socialAccount(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class);
    }

    public function isSuccessful(): bool
    {
        return $this->status === 'published';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }
}

