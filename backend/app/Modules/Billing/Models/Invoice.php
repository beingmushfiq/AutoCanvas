<?php

namespace App\Modules\Billing\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Organization\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $organization_id
 * @property string $invoice_number
 * @property string $plan_id
 * @property string $billing_cycle
 * @property float $amount
 * @property string $currency
 * @property \Carbon\Carbon|null $billing_period_start
 * @property \Carbon\Carbon|null $billing_period_end
 * @property \Carbon\Carbon|null $due_date
 * @property string $status
 * @property array|null $metadata
 */
class Invoice extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'organization_id',
        'invoice_number',
        'plan_id',
        'billing_cycle',
        'amount',
        'currency',
        'billing_period_start',
        'billing_period_end',
        'due_date',
        'status',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'billing_period_start' => 'date',
            'billing_period_end' => 'date',
            'due_date' => 'date',
            'metadata' => 'json',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }
}

