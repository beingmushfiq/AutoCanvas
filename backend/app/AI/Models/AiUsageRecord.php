<?php

namespace App\AI\Models;

use App\Core\Concerns\HasUlid;
use App\Models\User;
use App\Modules\Brand\Models\Brand;
use App\Modules\Organization\Models\Organization;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiUsageRecord extends Model
{
    use HasFactory, HasUlid;

    public $timestamps = false;

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'user_id',
        'provider',
        'model',
        'task_type',
        'input_tokens',
        'output_tokens',
        'image_count',
        'estimated_cost_usd',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'input_tokens' => 'integer',
            'output_tokens' => 'integer',
            'image_count' => 'integer',
            'estimated_cost_usd' => 'decimal:6',
            'created_at' => 'datetime',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
