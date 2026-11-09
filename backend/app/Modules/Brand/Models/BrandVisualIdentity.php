<?php

namespace App\Modules\Brand\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandVisualIdentity extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'brand_id',
        'organization_id',
        'primary_logo_url',
        'secondary_logo_url',
        'monochrome_logo_url',
        'mark_url',
        'primary_color',
        'secondary_color',
        'accent_colors',
        'background_colors',
        'primary_font',
        'secondary_font',
        'typography_hierarchy',
        'layout_preferences',
        'visual_exclusions',
    ];

    protected function casts(): array
    {
        return [
            'accent_colors' => 'array',
            'background_colors' => 'array',
            'typography_hierarchy' => 'array',
            'layout_preferences' => 'array',
            'visual_exclusions' => 'array',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }
}
