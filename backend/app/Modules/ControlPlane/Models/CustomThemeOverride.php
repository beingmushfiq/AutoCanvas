<?php

namespace App\Modules\ControlPlane\Models;

use App\Core\Concerns\HasUlid;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomThemeOverride extends Model
{
    use HasFactory, HasUlid;

    protected $table = 'custom_theme_overrides';

    protected $fillable = [
        'platform_name',
        'tagline',
        'creator_name',
        'creator_url',
        'primary_logo_url',
        'dark_logo_url',
        'favicon_url',
        'primary_color_hex',
        'accent_color_hex',
        'custom_css',
        'custom_head_scripts',
        'announcement_banner',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'announcement_banner' => 'array',
        ];
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}

