<?php

namespace App\Modules\Automation\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use App\Modules\Organization\Models\Organization;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandCadenceSetting extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $table = 'brand_cadence_settings';

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'autopilot_mode',
        'weekly_schedule',
        'novelty_threshold_cosine',
        'max_daily_posts_per_channel',
        'require_consensus_for_breaking_news',
        'is_active',
        'last_cycle_run_at',
    ];

    protected function casts(): array
    {
        return [
            'weekly_schedule' => 'array',
            'novelty_threshold_cosine' => 'float',
            'max_daily_posts_per_channel' => 'integer',
            'require_consensus_for_breaking_news' => 'boolean',
            'is_active' => 'boolean',
            'last_cycle_run_at' => 'datetime',
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
}

