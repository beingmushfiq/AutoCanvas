<?php

namespace App\Modules\Research\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Organization\Models\Organization;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitorPost extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'competitor_profile_id',
        'platform',
        'post_url',
        'post_text',
        'published_at',
        'engagement_signals',
        'observed_themes',
        'tone',
        'tactical_takeaway',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'engagement_signals' => 'array',
            'observed_themes' => 'array',
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

    public function competitor(): BelongsTo
    {
        return $this->belongsTo(CompetitorProfile::class, 'competitor_profile_id');
    }
}

