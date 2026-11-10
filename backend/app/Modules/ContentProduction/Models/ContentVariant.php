<?php

namespace App\Modules\ContentProduction\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        ];
    }

    public function contentItem(): BelongsTo
    {
        return $this->belongsTo(ContentItem::class);
    }
}
