<?php

namespace App\Modules\ControlPlane\Models;

use App\Core\Concerns\HasUlid;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiPromptTemplate extends Model
{
    use HasFactory, HasUlid;

    protected $table = 'ai_prompt_templates';

    protected $fillable = [
        'task_type',
        'version',
        'prompt_template',
        'model_override',
        'temperature',
        'max_tokens',
        'is_active',
        'change_summary',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'temperature' => 'float',
            'max_tokens' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}

