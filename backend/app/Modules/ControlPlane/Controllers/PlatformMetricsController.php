<?php

namespace App\Modules\ControlPlane\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Services\PlatformMetricsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformMetricsController extends Controller
{
    public function __construct(
        protected PlatformMetricsService $metricsService
    ) {}

    /**
     * Get real-time platform telemetry metrics.
     */
    public function metrics(Request $request): JsonResponse
    {
        $metrics = $this->metricsService->getMetrics();

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }
}

