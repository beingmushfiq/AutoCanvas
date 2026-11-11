<?php

namespace App\Modules\Billing\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Billing\Models\Invoice;
use App\Modules\Billing\Services\LocalPaymentService;
use App\Modules\Organization\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentSubmissionController extends Controller
{
    public function __construct(
        protected LocalPaymentService $paymentService
    ) {}

    /**
     * Submit a payment transaction (TrxID) for an invoice.
     */
    public function submit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invoice_id' => ['required', 'string'],
            'gateway' => ['required', 'string', 'in:bkash,nagad,bank_wire,manual'],
            'transaction_reference' => ['required', 'string', 'max:150'],
            'sender_number' => ['nullable', 'string', 'max:50'],
            'amount' => ['nullable', 'numeric', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $orgId = app('current_organization_id');
        $organization = Organization::findOrFail($orgId);

        $transaction = $this->paymentService->submitTransaction($organization, $validated['invoice_id'], $validated);

        return response()->json([
            'success' => true,
            'data' => [
                'transaction_id' => $transaction->id,
                'gateway' => $transaction->gateway,
                'transaction_reference' => $transaction->transaction_reference,
                'amount' => $transaction->amount,
                'currency' => $transaction->currency,
                'status' => $transaction->status,
                'submitted_at' => $transaction->created_at->toIso8601String(),
            ],
            'message' => 'Payment transaction submitted successfully. Pending administrative verification.',
        ], 201);
    }

    /**
     * List organization's billing invoices.
     */
    public function invoices(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');
        $invoices = Invoice::where('organization_id', $orgId)
            ->with(['plan', 'transactions'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $invoices->items(),
            'meta' => [
                'pagination' => [
                    'current_page' => $invoices->currentPage(),
                    'per_page' => $invoices->perPage(),
                    'total' => $invoices->total(),
                    'last_page' => $invoices->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * View single invoice details.
     */
    public function show(string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $invoice = Invoice::where('organization_id', $orgId)
            ->with(['plan', 'transactions'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $invoice,
        ]);
    }
}

