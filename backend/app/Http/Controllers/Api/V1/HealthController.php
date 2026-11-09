<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Throwable;

class HealthController extends Controller
{
    /**
     * System health check endpoint.
     */
    public function check(): JsonResponse
    {
        $dbStatus = 'disconnected';
        try {
            DB::connection()->getPdo();
            $dbStatus = 'connected';
        } catch (Throwable $e) {
            $dbStatus = 'error: '.$e->getMessage();
        }

        $redisStatus = 'disconnected';
        try {
            Redis::connection()->ping();
            $redisStatus = 'connected';
        } catch (Throwable $e) {
            $redisStatus = 'error: '.$e->getMessage();
        }

        $isHealthy = ($dbStatus === 'connected');

        return response()->json([
            'status' => $isHealthy ? 'ok' : 'degraded',
            'service' => 'AutoCanvas Core API',
            'version' => '1.0.0',
            'environment' => config('app.env'),
            'checks' => [
                'database' => $dbStatus,
                'redis' => $redisStatus,
            ],
            'timestamp' => now()->toIso8601String(),
        ], $isHealthy ? 200 : 503);
    }
}
