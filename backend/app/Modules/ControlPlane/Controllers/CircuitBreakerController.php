<?php

namespace App\Modules\ControlPlane\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Services\SystemSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CircuitBreakerController extends Controller
{
    public function __construct(
        protected SystemSettingsService $settingsService
    ) {}

    /**
     * Get active status of the master automation circuit breaker.
     */
    public function status(): JsonResponse
    {
        $isPaused = (bool) $this->settingsService->get('pause_all_automations', false);

        return response()->json([
            'success' => true,
            'data' => [
                'pause_all_automations' => $isPaused,
                'status' => $isPaused ? 'HALTED' : 'OPERATIONAL',
            ],
        ]);
    }

    /**
     * Toggle the emergency circuit breaker.
     */
    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pause' => ['required', 'boolean'],
        ]);

        $admin = $request->user();
        $isPaused = $this->settingsService->toggleCircuitBreaker($validated['pause'], $admin);

        return response()->json([
            'success' => true,
            'data' => [
                'pause_all_automations' => $isPaused,
                'status' => $isPaused ? 'HALTED' : 'OPERATIONAL',
            ],
            'message' => $isPaused
                ? 'EMERGENCY: All platform automations have been frozen.'
                : 'Platform automations have resumed normal operation.',
        ]);
    }
}

