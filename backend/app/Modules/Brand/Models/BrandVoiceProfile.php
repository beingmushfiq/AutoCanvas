<?php

namespace App\Modules\Brand\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandVoiceProfile extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'brand_id',
        'organization_id',
        'personality_traits',
        'tone',
        'communication_style',
        'preferred_language',
        'channel_language_rules',
        'formality_level',
        'vocabulary_rules',
    ];

    protected function casts(): array
    {
        return [
            'personality_traits' => 'array',
            'channel_language_rules' => 'array',
            'vocabulary_rules' => 'array',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }
}
