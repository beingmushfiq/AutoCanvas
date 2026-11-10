<?php

namespace App\Modules\Brand\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentStrategy\Models\Campaign;
use App\Modules\ContentStrategy\Models\ContentPillar;
use App\Modules\Knowledge\Models\KnowledgeSource;
use App\Modules\Knowledge\Models\SourceChunk;
use App\Modules\Organization\Models\Organization;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Brand extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'name',
        'slug',
        'industry',
        'sub_industry',
        'website_url',
        'status',
        'automation_policy',
    ];

    protected function casts(): array
    {
        return [
            'automation_policy' => 'array',
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

    public function profile(): HasOne
    {
        return $this->hasOne(BrandProfile::class);
    }

    public function visualIdentity(): HasOne
    {
        return $this->hasOne(BrandVisualIdentity::class);
    }

    public function voiceProfile(): HasOne
    {
        return $this->hasOne(BrandVoiceProfile::class);
    }

    public function assets(): HasMany
    {
        return $this->hasMany(BrandAsset::class);
    }

    public function memoryEntries(): HasMany
    {
        return $this->hasMany(BrandMemoryEntry::class);
    }

    public function knowledgeSources(): HasMany
    {
        return $this->hasMany(KnowledgeSource::class);
    }

    public function sourceChunks(): HasMany
    {
        return $this->hasMany(SourceChunk::class);
    }

    public function contentPillars(): HasMany
    {
        return $this->hasMany(ContentPillar::class);
    }

    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }

    public function contentItems(): HasMany
    {
        return $this->hasMany(ContentItem::class);
    }
}
