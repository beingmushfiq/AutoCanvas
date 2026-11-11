<?php

namespace App\Modules\Billing\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Models\User;
use App\Modules\Organization\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $invoice_id
 * @property string $organization_id
 * @property string $gateway
 * @property string|null $transaction_reference
 * @property string $normalized_trx_id
 * @property string|null $sender_number
 * @property string|null $gateway_payment_id
 * @property float $amount
 * @property float|null $exchange_rate_snapshot
 * @property float|null $amount_bdt
 * @property float|null $amount_usd
 * @property string $currency
 * @property string|null $idempotency_key
 * @property string $status
 * @property string|null $verified_by
 * @property \Carbon\Carbon|null $verified_at
 * @property string|null $notes
 * @property array|null $gateway_response
 * @property-read \App\Modules\Billing\Models\Invoice|null $invoice
 */
class PaymentTransaction extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $fillable = [
        'invoice_id',
        'organization_id',
        'gateway',
        'transaction_reference',
        'normalized_trx_id',
        'sender_number',
        'gateway_payment_id',
        'amount',
        'exchange_rate_snapshot',
        'amount_bdt',
        'amount_usd',
        'currency',
        'idempotency_key',
        'status',
        'verified_by',
        'verified_at',
        'notes',
        'gateway_response',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'exchange_rate_snapshot' => 'decimal:4',
            'amount_bdt' => 'decimal:2',
            'amount_usd' => 'decimal:2',
            'verified_at' => 'datetime',
            'gateway_response' => 'json',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function isVerified(): bool
    {
        return $this->status === 'verified';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}

