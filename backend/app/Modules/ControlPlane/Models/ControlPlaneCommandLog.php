<?php

namespace App\Modules\ControlPlane\Models;

use App\Core\Concerns\HasUlid;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ControlPlaneCommandLog extends Model
{
    use HasFactory, HasUlid;

    protected $table = 'control_plane_command_logs';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'raw_query',
        'detected_intent',
        'parameters',
        'safety_tier',
        'execution_status',
        'confirmation_token',
        'confirmed_at',
        'execution_result',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'parameters' => 'json',
            'execution_result' => 'json',
            'confirmed_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

