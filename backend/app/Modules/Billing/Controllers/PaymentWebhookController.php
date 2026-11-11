<?php

namespace App\Modules\Billing\Controllers;

use App\Http\Controllers\Controller;
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

        $transaction = PaymentTransaction::withoutGlobalScopes()
            ->where('gateway', 'bkash')
            ->where('normalized_trx_id', $trxRef)
            ->first();

        if ($transaction) {
            if ($transaction->status === 'verified') {
                return response()->json(['message' => 'Transaction already processed.'], 200);
            }

            $transaction->update([
                'status' => 'verified',
                'gateway_payment_id' => $validated['paymentID'],
                'verified_at' => now(),
                'gateway_response' => $validated,
            ]);

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
        $validated = $request->validate([
            'tran_id' => ['required', 'string'],
            'val_id' => ['nullable', 'string'],
            'amount' => ['required', 'numeric'],
            'status' => ['required', 'string'],
        ]);

        $trxRef = strtoupper(trim($validated['tran_id']));
        Log::info("SSLCommerz IPN Received: tran_id={$trxRef}, status={$validated['status']}");

        if (!in_array($validated['status'], ['VALID', 'VALIDATED'], true)) {
            return response()->json(['message' => 'SSLCommerz payment not valid, acknowledged.'], 200);
        }

        $transaction = PaymentTransaction::withoutGlobalScopes()
            ->where('gateway', 'manual') // or sslcommerz
            ->where('normalized_trx_id', $trxRef)
            ->first();

        if ($transaction) {
            $transaction->update([
                'status' => 'verified',
                'gateway_payment_id' => $validated['val_id'] ?? null,
                'verified_at' => now(),
                'gateway_response' => $validated,
            ]);

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
}
