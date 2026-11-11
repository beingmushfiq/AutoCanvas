<?php

namespace App\Modules\Publishing\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Organization\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublishingAttempt extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'organization_id',
        'publishing_job_id',
        'attempt_number',
        'status',
        'error',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(PublishingJob::class, 'publishing_job_id');
    }
}

