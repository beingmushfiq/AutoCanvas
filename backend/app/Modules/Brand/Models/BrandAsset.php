<?php

namespace App\Modules\Brand\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BrandAsset extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $fillable = [
        'brand_id',
        'organization_id',
        'workspace_id',
        'name',
        'type',
        'file_path',
        'file_url',
        'mime_type',
        'size_bytes',
        'dimensions',
        'tags',
    ];

    protected function casts(): array
    {
        return [
            'dimensions' => 'array',
            'tags' => 'array',
            'size_bytes' => 'integer',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }
}
