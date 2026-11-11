<?php

namespace App\Modules\ContentProduction\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Publishing\Models\PublishingDispatch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContentVariant extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'content_item_id',
        'platform',
        'caption',
        'hashtags',
        'cta_text',
        'cta_url',
        'character_count',
        'media_urls',
        'creative_document',
        'quality_score',
        'platform_options',
        'publishing_status',
        'scheduled_at',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'hashtags' => 'array',
            'media_urls' => 'array',
            'creative_document' => 'array',
            'platform_options' => 'array',
            'character_count' => 'integer',
            'quality_score' => 'integer',
            'scheduled_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function contentItem(): BelongsTo
    {
        return $this->belongsTo(ContentItem::class);
    }

    public function dispatches(): HasMany
    {
        return $this->hasMany(PublishingDispatch::class, 'content_variant_id');
    }
}
