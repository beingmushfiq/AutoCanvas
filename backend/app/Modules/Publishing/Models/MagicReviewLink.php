<?php

namespace App\Modules\Publishing\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\Organization\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MagicReviewLink extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $table = 'magic_review_links';

    protected $fillable = [
        'organization_id',
        'brand_id',
        'content_item_id',
        'dispatch_id',
        'token',
        'client_name',
        'client_email',
        'status',
        'client_feedback',
        'feedback_details',
        'expires_at',
        'accessed_at',
        'actioned_at',
    ];

    protected function casts(): array
    {
        return [
            'feedback_details' => 'array',
            'expires_at' => 'datetime',
            'accessed_at' => 'datetime',
            'actioned_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function contentItem(): BelongsTo
    {
        return $this->belongsTo(ContentItem::class);
    }

    public function dispatch(): BelongsTo
    {
        return $this->belongsTo(PublishingDispatch::class, 'dispatch_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isValid(): bool
    {
        return $this->status === 'active' && !$this->isExpired();
    }
}
