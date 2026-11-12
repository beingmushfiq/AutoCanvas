<?php

namespace App\Modules\Billing\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Billing\Models\Invoice;
use App\Modules\Billing\Models\PaymentTransaction;
use App\Modules\Billing\Services\LocalPaymentService;
use App\Modules\Organization\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function __construct(
        protected LocalPaymentService $paymentService
    ) {}

    /**
     * Handle bKash Tokenized Checkout Webhook / IPN.
     */
    public function handleBkash(Request $request): JsonResponse
    {
        // 1. Cryptographic / Secret Webhook Authentication
        if (! $this->verifyBkashSignature($request)) {
            Log::warning('bKash Webhook Unauthorized: Invalid or missing webhook signature from IP: '.$request->ip());

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED_WEBHOOK',
                    'message' => 'Invalid or missing webhook authentication signature.',
                ],
            ], 401);
        }

        $validated = $request->validate([
            'paymentID' => ['required', 'string'],
            'trxID' => ['required', 'string'],
            'transactionStatus' => ['required', 'string'],
            'amount' => ['required', 'numeric'],
            'currency' => ['nullable', 'string'],
        ]);

        $trxRef = strtoupper(trim($validated['trxID']));
        Log::info("bKash Webhook Received: paymentID={$validated['paymentID']}, trxID={$trxRef}, status={$validated['transactionStatus']}");

        if ($validated['transactionStatus'] !== 'Completed') {
            return response()->json(['message' => 'Status not completed, acknowledged.'], 200);
        }

        /** @var PaymentTransaction|null $transaction */
        $transaction = PaymentTransaction::withoutGlobalScopes()
            ->where('gateway', 'bkash')
            ->where('normalized_trx_id', $trxRef)
            ->first();

        if ($transaction) {
            if ($transaction->status === 'verified') {
                return response()->json(['message' => 'Transaction already processed.'], 200);
            }

            // 2. Strict Amount Integrity Verification
            if ((float) $validated['amount'] !== (float) $transaction->amount) {
                Log::warning("bKash Webhook Fraud Warning: Amount mismatch for trx {$trxRef}. Expected {$transaction->amount}, received {$validated['amount']}");

                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'AMOUNT_MISMATCH',
                        'message' => 'Webhook amount does not match expected transaction amount.',
                    ],
                ], 422);
            }

            $transaction->update([
                'status' => 'verified',
                'gateway_payment_id' => $validated['paymentID'],
                'verified_at' => now(),
                'gateway_response' => $validated,
            ]);

            /** @var Invoice|null $invoice */
            $invoice = $transaction->invoice;
            if ($invoice) {
                $invoice->update(['status' => 'paid']);
            }

            AuditLogger::log('payment.bkash_webhook_verified', $transaction, null, ['trx_id' => $trxRef], $transaction->organization_id);
        }

        return response()->json([
            'success' => true,
            'message' => 'bKash webhook processed successfully.',
        ]);
    }

    /**
     * Handle SSLCommerz IPN Webhook.
     */
    public function handleSslCommerz(Request $request): JsonResponse
    {
        // 1. Cryptographic / Secret Webhook Authentication
        if (! $this->verifySslCommerzSignature($request)) {
            Log::warning('SSLCommerz IPN Unauthorized: Invalid or missing webhook signature from IP: '.$request->ip());

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED_WEBHOOK',
                    'message' => 'Invalid or missing webhook authentication signature.',
                ],
            ], 401);
        }

        $validated = $request->validate([
            'tran_id' => ['required', 'string'],
            'val_id' => ['nullable', 'string'],
            'amount' => ['required', 'numeric'],
            'status' => ['required', 'string'],
        ]);

        $trxRef = strtoupper(trim($validated['tran_id']));
        Log::info("SSLCommerz IPN Received: tran_id={$trxRef}, status={$validated['status']}");

        if (! in_array($validated['status'], ['VALID', 'VALIDATED'], true)) {
            return response()->json(['message' => 'SSLCommerz payment not valid, acknowledged.'], 200);
        }

        /** @var PaymentTransaction|null $transaction */
        $transaction = PaymentTransaction::withoutGlobalScopes()
            ->where('gateway', 'manual') // or sslcommerz
            ->where('normalized_trx_id', $trxRef)
            ->first();

        if ($transaction) {
            if ($transaction->status === 'verified') {
                return response()->json(['message' => 'Transaction already processed.'], 200);
            }

            // 2. Strict Amount Integrity Verification
            if ((float) $validated['amount'] !== (float) $transaction->amount) {
                Log::warning("SSLCommerz IPN Fraud Warning: Amount mismatch for trx {$trxRef}. Expected {$transaction->amount}, received {$validated['amount']}");

                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'AMOUNT_MISMATCH',
                        'message' => 'IPN amount does not match expected transaction amount.',
                    ],
                ], 422);
            }

            $transaction->update([
                'status' => 'verified',
                'gateway_payment_id' => $validated['val_id'] ?? null,
                'verified_at' => now(),
                'gateway_response' => $validated,
            ]);

            /** @var Invoice|null $invoice */
            $invoice = $transaction->invoice;
            if ($invoice) {
                $invoice->update(['status' => 'paid']);
            }

            AuditLogger::log('payment.sslcommerz_ipn_verified', $transaction, null, ['tran_id' => $trxRef], $transaction->organization_id);
        }

        return response()->json([
            'success' => true,
            'message' => 'SSLCommerz IPN processed successfully.',
        ]);
    }

    /**
     * Verify bKash Webhook authorization signature or secret.
     */
    protected function verifyBkashSignature(Request $request): bool
    {
        $configuredSecret = config('services.bkash.webhook_secret') ?? env('BKASH_WEBHOOK_SECRET');
        if (empty($configuredSecret)) {
            return true;
        }

        $providedSecret = $request->header('X-Webhook-Secret')
            ?? $request->header('X-BKASH-SIGNATURE')
            ?? $request->bearerToken();

        return hash_equals((string) $configuredSecret, (string) $providedSecret);
    }

    /**
     * Verify SSLCommerz IPN authorization signature or secret.
     */
    protected function verifySslCommerzSignature(Request $request): bool
    {
        $configuredSecret = config('services.sslcommerz.webhook_secret')
            ?? env('SSLCOMMERZ_WEBHOOK_SECRET')
            ?? env('SSLCOMMERZ_STORE_PASSWD');

        if (empty($configuredSecret)) {
            return true;
        }

        $providedSecret = $request->header('X-Webhook-Secret')
            ?? $request->input('verify_sign')
            ?? $request->bearerToken();

        return hash_equals((string) $configuredSecret, (string) $providedSecret);
    }
}
