<?php

namespace App\Modules\Research\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\Organization\Models\Organization;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentFingerprint extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $table = 'content_fingerprints';

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'content_item_id',
        'channel',
        'simhash_64',
        'concept_summary',
        'hook_text',
        'embedding_vector',
        'creative_template_id',
        'color_palette_seed',
        'published_or_scheduled_at',
    ];

    protected function casts(): array
    {
        return [
            'simhash_64' => 'integer',
            'embedding_vector' => 'array',
            'published_or_scheduled_at' => 'datetime',
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
}

