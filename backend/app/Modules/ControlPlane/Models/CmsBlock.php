<?php

namespace App\Modules\ControlPlane\Models;

use App\Core\Concerns\HasUlid;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsBlock extends Model
{
    use HasFactory, HasUlid;

    protected $table = 'platform_cms_blocks';

    protected $fillable = [
        'block_key',
        'title',
        'content_json',
        'is_active',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'content_json' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}

