<?php

namespace App\Modules\ControlPlane\Services;

use App\Models\User;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use App\Modules\ControlPlane\Models\SystemSetting;
use Illuminate\Support\Facades\DB;

class SystemSettingsService
{
    /**
     * Get all platform system settings.
     */
    public function getAllSettings(): array
    {
        $settings = SystemSetting::with('updater')->get();

        return $settings->map(function ($s) {
            return [
                'key' => $s->key,
                'value' => $s->is_secret ? '********' : $s->value,
                'category' => $s->category,
                'is_secret' => $s->is_secret,
                'updated_at' => $s->updated_at?->toIso8601String(),
                'updated_by' => $s->updater?->name,
            ];
        })->all();
    }

    /**
     * Get single setting value by key.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $setting = SystemSetting::where('key', $key)->first();

        return $setting ? $setting->value : $default;
    }

    /**
     * Update or create a system setting, recording an audit diff in system_change_logs.
     */
    public function set(string $key, mixed $value, User $admin, string $category = 'general', bool $isSecret = false): SystemSetting
    {
        return DB::transaction(function () use ($key, $value, $admin, $category, $isSecret) {
            $setting = SystemSetting::where('key', $key)->first();
            $oldValue = $setting ? $setting->value : null;

            $updatedSetting = SystemSetting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value,
                    'category' => $category,
                    'is_secret' => $isSecret,
                    'updated_by' => $admin->id,
                ]
            );

            SystemChangeLog::create([
                'user_id' => $admin->id,
                'entity_type' => 'system_setting',
                'entity_id' => $key,
                'action' => $setting ? 'setting.updated' : 'setting.created',
                'old_values' => ['value' => $oldValue],
                'new_values' => ['value' => $value],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return $updatedSetting;
        });
    }

    /**
     * Toggle the master automation circuit breaker (pause_all_automations).
     */
    public function toggleCircuitBreaker(bool $pause, User $admin): bool
    {
        $this->set('pause_all_automations', $pause, $admin, 'emergency', false);

        SystemChangeLog::create([
            'user_id' => $admin->id,
            'entity_type' => 'emergency_circuit_breaker',
            'entity_id' => 'pause_all_automations',
            'action' => $pause ? 'circuit_breaker.activated' : 'circuit_breaker.deactivated',
            'old_values' => ['paused' => ! $pause],
            'new_values' => ['paused' => $pause],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);

        return $pause;
    }

    /**
     * Get recent change logs.
     */
    public function getChangeLogs(int $limit = 50): array
    {
        return SystemChangeLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name, 'email' => $log->user->email] : null,
                'entity_type' => $log->entity_type,
                'entity_id' => $log->entity_id,
                'action' => $log->action,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->toIso8601String(),
            ])
            ->all();
    }
}

