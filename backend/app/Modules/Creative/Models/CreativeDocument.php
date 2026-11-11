<?php

namespace App\Modules\Creative\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\Organization\Models\Organization;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CreativeDocument extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $table = 'creative_documents';

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'content_item_id',
        'content_variant_id',
        'name',
        'template_id',
        'aspect_ratio',
        'width',
        'height',
        'layers',
        'background_config',
        'rendered_asset_url',
        'render_status',
        'render_engine',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'layers' => 'array',
            'background_config' => 'array',
            'width' => 'integer',
            'height' => 'integer',
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
}

