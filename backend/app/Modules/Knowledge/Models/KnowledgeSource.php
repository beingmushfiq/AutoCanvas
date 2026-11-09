<?php

namespace App\Modules\Knowledge\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeSource extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'source_type',
        'display_name',
        'original_uri',
        'content_fingerprint',
        'credibility',
        'status',
        'error_message',
        'citation_metadata',
    ];

    protected function casts(): array
    {
        return [
            'citation_metadata' => 'array',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function chunks(): HasMany
    {
        return $this->hasMany(SourceChunk::class);
    }
}
