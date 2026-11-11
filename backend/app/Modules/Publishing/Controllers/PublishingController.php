<?php

namespace App\Modules\Publishing\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\Publishing\Models\PublishingDispatch;
use App\Modules\Publishing\Services\PublishingOrchestratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class PublishingController extends Controller
{
    public function __construct(
        protected PublishingOrchestratorService $orchestrator
    ) {}

    /**
     * Dispatch an approved content variant immediately.
     */
    public function publishNow(Request $request, string $variantId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $variant = ContentVariant::with('contentItem')->where('organization_id', $orgId)->findOrFail($variantId);

        $validated = $request->validate([
            'social_account_id' => ['nullable', 'string'],
            'idempotency_key' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $dispatch = $this->orchestrator->dispatchNow(
                $variant,
                $validated['social_account_id'] ?? null,
                $validated['idempotency_key'] ?? null
            );

            return response()->json([
                'success' => true,
                'data' => $dispatch->fresh(['socialAccount']),
                'message' => 'Variant publishing dispatched successfully.',
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'PUBLISHING_GATE_BLOCKED',
                    'message' => $e->getMessage(),
                ],
            ], 422);
        }
    }

    /**
     * Schedule an approved content variant for future publishing.
     */
    public function schedule(Request $request, string $variantId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $variant = ContentVariant::with('contentItem')->where('organization_id', $orgId)->findOrFail($variantId);

        $validated = $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
            'social_account_id' => ['nullable', 'string'],
        ]);

        try {
            $dispatch = $this->orchestrator->schedule(
                $variant,
                $validated['scheduled_at'],
                $validated['social_account_id'] ?? null
            );

            return response()->json([
                'success' => true,
                'data' => $dispatch->fresh(['socialAccount']),
                'message' => 'Variant scheduled for automated publication.',
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'SCHEDULING_GATE_BLOCKED',
                    'message' => $e->getMessage(),
                ],
            ], 422);
        }
    }

    /**
     * Cancel a pending queued dispatch.
     */
    public function cancel(string $dispatchId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $dispatch = PublishingDispatch::where('organization_id', $orgId)->findOrFail($dispatchId);

        $cancelled = $this->orchestrator->cancelDispatch($dispatch);

        if (!$cancelled) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'CANNOT_CANCEL_DISPATCH',
                    'message' => 'Dispatch is already processing or has completed and cannot be cancelled.',
                ],
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => $dispatch->fresh(),
            'message' => 'Publishing dispatch cancelled successfully.',
        ]);
    }

    /**
     * List dispatches with status filters.
     */
    public function index(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');
        $query = PublishingDispatch::where('organization_id', $orgId)
            ->with(['contentVariant', 'socialAccount', 'brand']);

        if ($request->has('brand_id')) {
            $query->where('brand_id', $request->query('brand_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        $dispatches = $query->orderBy('created_at', 'desc')->paginate(25);

        return response()->json([
            'success' => true,
            'data' => $dispatches->items(),
            'meta' => [
                'current_page' => $dispatches->currentPage(),
                'total' => $dispatches->total(),
            ],
        ]);
    }

    /**
     * Show single dispatch details.
     */
    public function show(string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $dispatch = PublishingDispatch::where('organization_id', $orgId)
            ->with(['contentVariant', 'socialAccount', 'brand'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $dispatch,
        ]);
    }

    /**
     * Emergency Circuit Breaker: Halt all publishing automations.
     */
    public function pauseAutomations(): JsonResponse
    {
        $orgId = app('current_organization_id');
        $this->orchestrator->triggerEmergencyPause($orgId);

        return response()->json([
            'success' => true,
            'paused' => true,
            'message' => 'Emergency circuit breaker activated. All scheduled and queued automations paused.',
        ]);
    }

    /**
     * Emergency Circuit Breaker: Resume publishing automations.
     */
    public function resumeAutomations(): JsonResponse
    {
        $orgId = app('current_organization_id');
        $this->orchestrator->resumeAutomations($orgId);

        return response()->json([
            'success' => true,
            'paused' => false,
            'message' => 'Automated publishing resumed successfully.',
        ]);
    }

    /**
     * Get emergency circuit breaker status.
     */
    public function circuitBreakerStatus(): JsonResponse
    {
        $orgId = app('current_organization_id');
        $isPaused = $this->orchestrator->isPaused($orgId);

        return response()->json([
            'success' => true,
            'paused' => $isPaused,
        ]);
    }
}

