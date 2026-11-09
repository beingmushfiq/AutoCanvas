<?php

namespace App\Modules\Brand\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandProfile extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'brand_id',
        'organization_id',
        'business_description',
        'mission',
        'vision',
        'positioning',
        'products_services',
        'target_audience',
        'personas',
        'geographic_markets',
        'usps',
        'content_objectives',
        'primary_cta',
        'secondary_cta',
        'prohibited_subjects',
        'restricted_claims',
        'publishing_rules',
    ];

    protected function casts(): array
    {
        return [
            'products_services' => 'array',
            'personas' => 'array',
            'geographic_markets' => 'array',
            'usps' => 'array',
            'content_objectives' => 'array',
            'prohibited_subjects' => 'array',
            'restricted_claims' => 'array',
            'publishing_rules' => 'array',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }
}
