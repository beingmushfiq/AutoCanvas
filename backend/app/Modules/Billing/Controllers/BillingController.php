<?php

namespace App\Modules\Billing\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Billing\Models\Plan;
use App\Modules\Billing\Services\EntitlementService;
use App\Modules\Organization\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function __construct(
        protected EntitlementService $entitlementService
    ) {}

    /**
     * List all active subscription plans.
     */
    public function plans(): JsonResponse
    {
        $plans = Plan::where('is_active', true)->orderBy('price_monthly')->get();

        return response()->json([
            'success' => true,
            'data' => $plans->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'price_monthly' => $p->price_monthly,
                'price_yearly' => $p->price_yearly,
                'features' => $p->features,
            ]),
        ]);
    }

    /**
     * Get active organization's subscription status and entitlement usage limits.
     */
    public function subscription(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');
        $organization = Organization::findOrFail($orgId);

        $summary = $this->entitlementService->getUsageSummary($organization);
        $subscription = $organization->subscription()->with('plan')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'subscription' => $subscription ? [
                    'id' => $subscription->id,
                    'status' => $subscription->status,
                    'current_period_start' => $subscription->current_period_start?->toIso8601String(),
                    'current_period_end' => $subscription->current_period_end?->toIso8601String(),
                ] : null,
                'summary' => $summary,
            ],
        ]);
    }
}
