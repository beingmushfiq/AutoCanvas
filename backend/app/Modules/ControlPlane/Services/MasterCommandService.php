<?php

namespace App\Modules\ControlPlane\Services;

use App\Models\User;
use App\Modules\ControlPlane\Models\ControlPlaneCommandLog;
use App\Modules\Organization\Models\Organization;
use Illuminate\Support\Str;

class MasterCommandService
{
    public function __construct(
        protected PlatformMetricsService $metricsService,
        protected TenantGovernanceService $governanceService,
        protected SystemSettingsService $settingsService
    ) {}

    /**
     * Process an incoming natural language command query.
     */
    public function parseAndExecute(string $query, User $admin): array
    {
        $parsed = $this->classifyIntent($query);

        $intent = $parsed['intent'];
        $parameters = $parsed['parameters'];
        $tier = $parsed['tier'];

        // If safe or moderate without destructive flag, execute immediately
        if ($tier === 'safe') {
            $result = $this->dispatchAction($intent, $parameters, $admin);

            ControlPlaneCommandLog::create([
                'user_id' => $admin->id,
                'raw_query' => $query,
                'detected_intent' => $intent,
                'parameters' => $parameters,
                'safety_tier' => 'safe',
                'execution_status' => 'executed',
                'execution_result' => $result,
                'created_at' => now(),
            ]);

            return [
                'status' => 'executed',
                'intent' => $intent,
                'safety_tier' => 'safe',
                'result' => $result,
            ];
        }

        // Destructive commands require two-stage confirmation
        $confirmationToken = hash_hmac('sha256', "{$admin->id}:{$intent}:" . microtime(), config('app.key'));

        $log = ControlPlaneCommandLog::create([
            'user_id' => $admin->id,
            'raw_query' => $query,
            'detected_intent' => $intent,
            'parameters' => $parameters,
            'safety_tier' => $tier,
            'execution_status' => 'pending_confirmation',
            'confirmation_token' => $confirmationToken,
            'created_at' => now(),
        ]);

        return [
            'status' => 'pending_confirmation',
            'command_id' => $log->id,
            'intent' => $intent,
            'parameters' => $parameters,
            'safety_tier' => $tier,
            'confirmation_token' => $confirmationToken,
            'warning' => $this->getImpactWarning($intent, $parameters),
            'expires_in_seconds' => 60,
        ];
    }

    /**
     * Confirm and execute a pending command via confirmation token.
     */
    public function confirmCommand(string $token, User $admin): array
    {
        $log = ControlPlaneCommandLog::where('confirmation_token', $token)
            ->where('execution_status', 'pending_confirmation')
            ->firstOrFail();

        // Expire after 60 seconds
        if ($log->created_at->diffInSeconds(now()) > 60) {
            $log->update(['execution_status' => 'rejected']);
            abort(408, 'Confirmation token expired. Please re-issue the command.');
        }

        $result = $this->dispatchAction($log->detected_intent, $log->parameters, $admin);

        $log->update([
            'execution_status' => 'executed',
            'confirmed_at' => now(),
            'execution_result' => $result,
        ]);

        return [
            'status' => 'executed',
            'intent' => $log->detected_intent,
            'result' => $result,
            'confirmed_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Classify natural language query into intent, parameters, and safety tier.
     */
    protected function classifyIntent(string $query): array
    {
        $q = strtolower(trim($query));

        // 1. Metrics / Telemetry
        if (Str::contains($q, ['metrics', 'telemetry', 'revenue', 'mrr', 'arr', 'health', 'stats'])) {
            return [
                'intent' => 'ACTION_GET_METRICS',
                'parameters' => [],
                'tier' => 'safe',
            ];
        }

        // 2. Emergency Circuit Breaker
        if (Str::contains($q, ['pause all', 'emergency pause', 'activate circuit breaker', 'freeze all'])) {
            return [
                'intent' => 'ACTION_CIRCUIT_BREAKER_ACTIVATE',
                'parameters' => ['pause' => true],
                'tier' => 'destructive',
            ];
        }

        if (Str::contains($q, ['resume all', 'deactivate circuit breaker', 'unfreeze all', 'unpause all'])) {
            return [
                'intent' => 'ACTION_CIRCUIT_BREAKER_DEACTIVATE',
                'parameters' => ['pause' => false],
                'tier' => 'moderate',
            ];
        }

        // 3. Suspend Tenant
        if (Str::contains($q, ['suspend', 'freeze organization', 'ban tenant', 'block org'])) {
            $orgSlug = $this->extractSlugFromQuery($q);
            return [
                'intent' => 'ACTION_SUSPEND_TENANT',
                'parameters' => ['slug' => $orgSlug],
                'tier' => 'destructive',
            ];
        }

        // 4. Resume Tenant
        if (Str::contains($q, ['resume organization', 'activate organization', 'unfreeze organization', 'activate tenant'])) {
            $orgSlug = $this->extractSlugFromQuery($q);
            return [
                'intent' => 'ACTION_RESUME_TENANT',
                'parameters' => ['slug' => $orgSlug],
                'tier' => 'moderate',
            ];
        }

        // 5. Inspect Tenant
        if (Str::contains($q, ['inspect', 'view organization', 'show tenant', 'check org'])) {
            $orgSlug = $this->extractSlugFromQuery($q);
            return [
                'intent' => 'ACTION_INSPECT_TENANT',
                'parameters' => ['slug' => $orgSlug],
                'tier' => 'safe',
            ];
        }

        // Fallback default
        return [
            'intent' => 'ACTION_GET_METRICS',
            'parameters' => [],
            'tier' => 'safe',
        ];
    }

    /**
     * Dispatch classified intent to domain service.
     */
    protected function dispatchAction(string $intent, array $parameters, User $admin): array
    {
        return match ($intent) {
            'ACTION_GET_METRICS' => $this->metricsService->getMetrics(),

            'ACTION_CIRCUIT_BREAKER_ACTIVATE' => [
                'circuit_breaker_paused' => $this->settingsService->toggleCircuitBreaker(true, $admin),
                'message' => 'All platform automations have been paused.',
            ],

            'ACTION_CIRCUIT_BREAKER_DEACTIVATE' => [
                'circuit_breaker_paused' => $this->settingsService->toggleCircuitBreaker(false, $admin),
                'message' => 'Platform automations have resumed.',
            ],

            'ACTION_SUSPEND_TENANT' => (function () use ($parameters, $admin) {
                $slug = $parameters['slug'] ?? '';
                $org = Organization::withoutGlobalScopes()->where('slug', $slug)->firstOrFail();
                $this->governanceService->suspendOrganization($org->id, $admin, 'Suspended via Master Command Interface');
                return [
                    'organization_id' => $org->id,
                    'organization_slug' => $org->slug,
                    'status' => 'suspended',
                    'message' => "Organization {$org->name} has been suspended.",
                ];
            })(),

            'ACTION_RESUME_TENANT' => (function () use ($parameters, $admin) {
                $slug = $parameters['slug'] ?? '';
                $org = Organization::withoutGlobalScopes()->where('slug', $slug)->firstOrFail();
                $this->governanceService->activateOrganization($org->id, $admin);
                return [
                    'organization_id' => $org->id,
                    'organization_slug' => $org->slug,
                    'status' => 'active',
                    'message' => "Organization {$org->name} has been activated.",
                ];
            })(),

            'ACTION_INSPECT_TENANT' => (function () use ($parameters) {
                $slug = $parameters['slug'] ?? '';
                $org = Organization::withoutGlobalScopes()->where('slug', $slug)->firstOrFail();
                return [
                    'organization' => $this->governanceService->getOrganization($org->id),
                ];
            })(),

            default => ['error' => 'Unknown action intent'],
        };
    }

    protected function extractSlugFromQuery(string $query): string
    {
        $words = preg_split('/\s+/', $query);
        return end($words);
    }

    protected function getImpactWarning(string $intent, array $parameters): string
    {
        return match ($intent) {
            'ACTION_SUSPEND_TENANT' => "Suspending this tenant will immediately revoke active user access tokens and freeze all scheduled social publishing jobs for {$parameters['slug']}.",
            'ACTION_CIRCUIT_BREAKER_ACTIVATE' => "Activating the emergency circuit breaker will immediately halt all background publishing and research workers across the entire platform.",
            default => 'This action mutates platform state and requires operator confirmation.',
        };
    }
}

