<?php

namespace App\Modules\ControlPlane\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Services\SystemSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingsController extends Controller
{
    public function __construct(
        protected SystemSettingsService $settingsService
    ) {}

    /**
     * List all system settings.
     */
    public function index(): JsonResponse
    {
        $settings = $this->settingsService->getAllSettings();

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Update a system setting.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100'],
            'value' => ['required'],
            'category' => ['nullable', 'string', 'max:50'],
            'is_secret' => ['nullable', 'boolean'],
        ]);

        $admin = $request->user();
        $setting = $this->settingsService->set(
            $validated['key'],
            $validated['value'],
            $admin,
            $validated['category'] ?? 'general',
            $validated['is_secret'] ?? false
        );

        return response()->json([
            'success' => true,
            'data' => [
                'key' => $setting->key,
                'value' => $setting->is_secret ? '********' : $setting->value,
                'category' => $setting->category,
                'updated_at' => $setting->updated_at?->toIso8601String(),
            ],
            'message' => "Setting '{$setting->key}' updated successfully.",
        ]);
    }

    /**
     * List recent configuration change logs.
     */
    public function changeLogs(Request $request): JsonResponse
    {
        $limit = (int) $request->get('limit', 50);
        $logs = $this->settingsService->getChangeLogs($limit);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}

