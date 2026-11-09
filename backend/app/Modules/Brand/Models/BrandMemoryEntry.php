<?php

namespace App\Modules\Brand\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandMemoryEntry extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'brand_id',
        'organization_id',
        'category',
        'title',
        'content',
        'confidence_score',
        'metadata',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'confidence_score' => 'decimal:2',
            'metadata' => 'array',
            'version' => 'integer',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }
}
