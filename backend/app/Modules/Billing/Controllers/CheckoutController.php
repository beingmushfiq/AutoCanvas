<?php

namespace App\Modules\Billing\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Billing\Models\Plan;
use App\Modules\Billing\Services\LocalPaymentService;
use App\Modules\Organization\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __construct(
        protected LocalPaymentService $paymentService
    ) {}

    /**
     * Generate an invoice and local payment instructions for an upgrade or renewal.
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_slug' => ['required', 'string', 'exists:plans,slug'],
            'billing_cycle' => ['nullable', 'string', 'in:monthly,yearly'],
            'currency' => ['nullable', 'string', 'in:BDT,USD'],
        ]);

        $orgId = app('current_organization_id');
        $organization = Organization::findOrFail($orgId);

        $plan = Plan::where('slug', $validated['plan_slug'])->where('is_active', true)->firstOrFail();
        $cycle = $validated['billing_cycle'] ?? 'monthly';
        $currency = $validated['currency'] ?? 'BDT';

        $checkoutData = $this->paymentService->checkout($organization, $plan, $cycle, $currency);

        return response()->json([
            'success' => true,
            'data' => $checkoutData,
            'message' => 'Checkout invoice created. Please follow the payment instructions.',
        ], 201);
    }
}

