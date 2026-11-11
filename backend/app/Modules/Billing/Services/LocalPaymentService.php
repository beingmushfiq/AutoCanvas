<?php

namespace App\Modules\Billing\Services;

use App\Models\User;
use App\Modules\Billing\Models\Invoice;
use App\Modules\Billing\Models\PaymentTransaction;
use App\Modules\Billing\Models\Plan;
use App\Modules\Billing\Models\Subscription;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use App\Modules\ControlPlane\Services\SystemSettingsService;
use App\Modules\Organization\Models\AuditLog;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Services\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LocalPaymentService
{
    public function __construct(
        protected SystemSettingsService $settingsService
    ) {}

    /**
     * Generate an invoice and local payment instructions for an organization checkout.
     */
    public function checkout(Organization $organization, Plan $plan, string $billingCycle = 'monthly', string $currency = 'BDT'): array
    {
        $basePriceUsd = $billingCycle === 'yearly'
            ? (float) $plan->price_yearly
            : (float) $plan->price_monthly;

        $exchangeRate = (float) $this->settingsService->get('usd_to_bdt_rate', 120.00);

        $payableAmount = $currency === 'BDT'
            ? round($basePriceUsd * $exchangeRate, 2)
            : $basePriceUsd;

        $invoiceNumber = $this->generateInvoiceNumber();

        $invoice = Invoice::create([
            'organization_id' => $organization->id,
            'invoice_number' => $invoiceNumber,
            'plan_id' => $plan->id,
            'billing_cycle' => $billingCycle,
            'amount' => $payableAmount,
            'currency' => $currency,
            'billing_period_start' => now()->toDateString(),
            'billing_period_end' => $billingCycle === 'yearly'
                ? now()->addYear()->toDateString()
                : now()->addMonth()->toDateString(),
            'due_date' => now()->addDays(3)->toDateString(),
            'status' => 'unpaid',
            'metadata' => [
                'plan_name' => $plan->name,
                'plan_slug' => $plan->slug,
                'base_price_usd' => $basePriceUsd,
                'exchange_rate' => $exchangeRate,
            ],
        ]);

        $instructions = $this->getPaymentInstructions($invoice);

        return [
            'invoice' => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'plan_name' => $plan->name,
                'billing_cycle' => $invoice->billing_cycle,
                'amount' => $invoice->amount,
                'currency' => $invoice->currency,
                'due_date' => $invoice->due_date->toDateString(),
                'status' => $invoice->status,
            ],
            'instructions' => $instructions,
        ];
    }

    /**
     * Submit a mobile money or bank wire transaction for an invoice.
     */
    public function submitTransaction(Organization $organization, string $invoiceId, array $data): PaymentTransaction
    {
        $invoice = Invoice::where('organization_id', $organization->id)->findOrFail($invoiceId);

        if (! in_array($invoice->status, ['unpaid', 'processing'], true)) {
            abort(422, "This invoice is {$invoice->status} and cannot accept new payments.");
        }

        $trxRef = strtoupper(trim($data['transaction_reference']));
        $idempotencyKey = hash('sha256', "{$organization->id}:{$invoice->id}:{$trxRef}");

        // Assert idempotency
        if (PaymentTransaction::withoutGlobalScopes()->where('idempotency_key', $idempotencyKey)->exists()) {
            abort(409, 'A payment with this Transaction ID has already been submitted for this invoice.');
        }

        return DB::transaction(function () use ($invoice, $organization, $data, $trxRef, $idempotencyKey) {
            $transaction = PaymentTransaction::create([
                'invoice_id' => $invoice->id,
                'organization_id' => $organization->id,
                'gateway' => $data['gateway'],
                'transaction_reference' => $trxRef,
                'sender_number' => $data['sender_number'] ?? null,
                'amount' => $data['amount'] ?? $invoice->amount,
                'currency' => $data['currency'] ?? $invoice->currency,
                'idempotency_key' => $idempotencyKey,
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
            ]);

            $invoice->update(['status' => 'processing']);

            AuditLogger::log('payment.transaction_submitted', $transaction, null, [
                'invoice_number' => $invoice->invoice_number,
                'gateway' => $transaction->gateway,
                'trx_id' => $trxRef,
            ], $organization->id);

            return $transaction;
        });
    }

    /**
     * Admin review: Approve or reject a submitted transaction.
     */
    public function verifyTransaction(string $transactionId, User $admin, bool $approve, ?string $notes = null): PaymentTransaction
    {
        return DB::transaction(function () use ($transactionId, $admin, $approve, $notes) {
            $transaction = PaymentTransaction::withoutGlobalScopes()
                ->with(['invoice.plan', 'organization'])
                ->findOrFail($transactionId);

            $invoice = $transaction->invoice;
            $org = $transaction->organization;

            if ($approve) {
                // 1. Mark transaction verified
                $transaction->update([
                    'status' => 'verified',
                    'verified_by' => $admin->id,
                    'verified_at' => now(),
                    'notes' => $notes,
                ]);

                // 2. Mark invoice paid
                $invoice->update(['status' => 'paid']);

                // 3. Renew / Update Subscription
                $sub = Subscription::firstOrNew(['organization_id' => $org->id]);
                $sub->plan_id = $invoice->plan_id;
                $sub->status = 'active';
                $sub->current_period_start = now();
                $sub->current_period_end = $invoice->billing_cycle === 'yearly'
                    ? now()->addYear()
                    : now()->addMonth();
                $sub->save();

                // 4. Audit Log
                SystemChangeLog::create([
                    'user_id' => $admin->id,
                    'entity_type' => 'payment_transaction',
                    'entity_id' => $transaction->id,
                    'action' => 'payment.verified',
                    'old_values' => ['status' => 'pending'],
                    'new_values' => [
                        'status' => 'verified',
                        'invoice_id' => $invoice->id,
                        'plan' => $invoice->plan?->name,
                    ],
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'created_at' => now(),
                ]);

                AuditLog::create([
                    'organization_id' => $org->id,
                    'user_id' => $admin->id,
                    'action' => 'subscription.renewed_by_payment',
                    'entity_type' => Subscription::class,
                    'entity_id' => $sub->id,
                    'old_values' => null,
                    'new_values' => [
                        'plan_id' => $sub->plan_id,
                        'current_period_end' => $sub->current_period_end->toIso8601String(),
                    ],
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
            } else {
                // Rejection flow
                $transaction->update([
                    'status' => 'rejected',
                    'verified_by' => $admin->id,
                    'verified_at' => now(),
                    'notes' => $notes ?? 'Transaction details could not be verified.',
                ]);

                $invoice->update(['status' => 'unpaid']);

                SystemChangeLog::create([
                    'user_id' => $admin->id,
                    'entity_type' => 'payment_transaction',
                    'entity_id' => $transaction->id,
                    'action' => 'payment.rejected',
                    'old_values' => ['status' => 'pending'],
                    'new_values' => ['status' => 'rejected', 'notes' => $notes],
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'created_at' => now(),
                ]);
            }

            return $transaction;
        });
    }

    /**
     * Get pending verification queue for Control Plane.
     */
    public function getVerificationQueue(int $perPage = 20): LengthAwarePaginator
    {
        return PaymentTransaction::withoutGlobalScopes()
            ->with(['organization', 'invoice.plan'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);
    }

    /**
     * Generate sequential invoice number: INV-YYYYMM-XXXX
     */
    protected function generateInvoiceNumber(): string
    {
        $prefix = 'INV-' . date('Ym') . '-';
        $countThisMonth = Invoice::withoutGlobalScopes()
            ->where('invoice_number', 'like', "{$prefix}%")
            ->count();

        $sequence = str_pad((string) ($countThisMonth + 1), 4, '0', STR_PAD_LEFT);

        return "{$prefix}{$sequence}";
    }

    /**
     * Structured payment instructions for tenant checkout modal.
     */
    protected function getPaymentInstructions(Invoice $invoice): array
    {
        return [
            'payable_amount' => $invoice->amount,
            'currency' => $invoice->currency,
            'invoice_number' => $invoice->invoice_number,
            'methods' => [
                'bkash' => [
                    'name' => 'bKash Merchant Payment / Personal',
                    'account_number' => '01711000000',
                    'type' => 'Merchant Payment / Send Money',
                    'reference' => $invoice->invoice_number,
                    'steps' => [
                        'Open your bKash app and tap Payment / Send Money.',
                        'Enter 01711000000 as the recipient wallet.',
                        "Enter {$invoice->amount} as the amount.",
                        "Use {$invoice->invoice_number} as the reference.",
                        'Enter your bKash PIN to confirm transaction.',
                        'Copy the Transaction ID (TrxID) and submit it below.',
                    ],
                ],
                'nagad' => [
                    'name' => 'Nagad Merchant Payment',
                    'account_number' => '01811000000',
                    'type' => 'Merchant Payment',
                    'reference' => $invoice->invoice_number,
                    'steps' => [
                        'Open your Nagad app and tap Merchant Pay.',
                        'Enter 01811000000 as the merchant account number.',
                        "Enter {$invoice->amount} as the amount.",
                        "Use {$invoice->invoice_number} as the reference counter.",
                        'Copy the Transaction ID (TrxID) and submit it below.',
                    ],
                ],
                'bank_wire' => [
                    'name' => 'Bank Transfer (City Bank PLC)',
                    'account_name' => 'AutoCanvas Technologies Ltd',
                    'account_number' => '1102938475001',
                    'bank_name' => 'City Bank PLC',
                    'branch' => 'Gulshan Avenue Branch, Dhaka',
                    'routing_number' => '225271849',
                    'swift_code' => 'CIBLBDDH',
                ],
            ],
        ];
    }
}

