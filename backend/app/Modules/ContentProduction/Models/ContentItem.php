<?php

namespace App\Modules\ContentProduction\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Models\User;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentStrategy\Models\Campaign;
use App\Modules\ContentStrategy\Models\ContentPillar;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContentItem extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'content_pillar_id',
        'campaign_id',
        'created_by_user_id',
        'title',
        'concept',
        'source_context',
        'status',
        'risk_level',
        'overall_quality_score',
        'qa_report',
        'review_feedback',
        'reviewed_by_user_id',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'source_context' => 'array',
            'qa_report' => 'array',
            'overall_quality_score' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function pillar(): BelongsTo
    {
        return $this->belongsTo(ContentPillar::class, 'content_pillar_id');
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ContentVariant::class);
    }
}
