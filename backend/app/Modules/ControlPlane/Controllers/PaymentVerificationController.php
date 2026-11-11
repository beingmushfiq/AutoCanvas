<?php

namespace App\Modules\ControlPlane\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Billing\Services\LocalPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentVerificationController extends Controller
{
    public function __construct(
        protected LocalPaymentService $paymentService
    ) {}

    /**
     * List all pending payment transactions awaiting verification.
     */
    public function queue(Request $request): JsonResponse
    {
        $perPage = (int) $request->get('per_page', 20);
        $paginator = $this->paymentService->getVerificationQueue($perPage);

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'meta' => [
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Approve or reject a payment transaction.
     */
    public function verify(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'approve' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $admin = $request->user();
        $transaction = $this->paymentService->verifyTransaction(
            $id,
            $admin,
            $validated['approve'],
            $validated['notes'] ?? null
        );

        $statusMessage = $transaction->isVerified()
            ? 'Payment verified successfully and subscription renewed.'
            : 'Payment transaction marked as rejected.';

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $transaction->id,
                'status' => $transaction->status,
                'verified_at' => $transaction->verified_at?->toIso8601String(),
                'verified_by' => $admin->name,
            ],
            'message' => $statusMessage,
        ]);
    }
}

