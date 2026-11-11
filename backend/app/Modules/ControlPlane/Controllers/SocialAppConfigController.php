<?php

namespace App\Modules\ControlPlane\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Models\SystemSetting;
use App\Modules\SocialConnectors\Models\SocialAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SocialAppConfigController extends Controller
{
    /**
     * View global social app credentials (masked).
     */
    public function index(): JsonResponse
    {
        $metaAppId = SystemSetting::where('key', 'meta_app_id')->value('value') ?? config('services.meta.app_id');
        $metaSecret = SystemSetting::where('key', 'meta_app_secret')->value('value') ?? config('services.meta.app_secret');
        $metaVersion = SystemSetting::where('key', 'meta_graph_version')->value('value') ?? config('services.meta.graph_version', 'v21.0');

        $linkedinClientId = SystemSetting::where('key', 'linkedin_client_id')->value('value') ?? config('services.linkedin.client_id');
        $linkedinSecret = SystemSetting::where('key', 'linkedin_client_secret')->value('value') ?? config('services.linkedin.client_secret');

        return response()->json([
            'success' => true,
            'data' => [
                'meta' => [
                    'app_id' => $metaAppId ? substr((string)$metaAppId, 0, 4) . '***' : null,
                    'app_secret_configured' => !empty($metaSecret),
                    'graph_version' => $metaVersion,
                ],
                'linkedin' => [
                    'client_id' => $linkedinClientId ? substr((string)$linkedinClientId, 0, 4) . '***' : null,
                    'client_secret_configured' => !empty($linkedinSecret),
                ],
            ],
        ]);
    }

    /**
     * Update global social app credentials.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'meta_app_id' => 'nullable|string',
            'meta_app_secret' => 'nullable|string',
            'meta_graph_version' => 'nullable|string',
            'linkedin_client_id' => 'nullable|string',
            'linkedin_client_secret' => 'nullable|string',
        ]);

        $userId = $request->user()->id;

        foreach ($validated as $key => $val) {
            if ($val !== null) {
                $isSecret = str_contains($key, 'secret');
                SystemSetting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => $val,
                        'category' => 'social_apps',
                        'is_secret' => $isSecret,
                        'updated_by' => $userId,
                    ]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Social app credentials updated successfully.',
        ]);
    }

    /**
     * Platform-wide social accounts telemetry across all organizations.
     */
    public function accounts(Request $request): JsonResponse
    {
        $platform = $request->query('platform');
        $status = $request->query('status');

        $query = SocialAccount::withoutGlobalScopes()->with(['organization:id,name,slug']);

        if ($platform) {
            $query->where('platform', $platform);
        }

        if ($status) {
            $query->where('connection_status', $status);
        }

        $totalAccounts = (clone $query)->count();
        $connectedCount = (clone $query)->where('connection_status', 'connected')->count();
        $expiredCount = (clone $query)->where('connection_status', 'expired')->count();

        $accounts = $query->latest()->limit(50)->get()->map(function (SocialAccount $account) {
            return [
                'id' => $account->id,
                'organization' => $account->organization ? [
                    'id' => $account->organization->id,
                    'name' => $account->organization->name,
                ] : null,
                'platform' => $account->platform,
                'provider_id' => $account->provider_id,
                'account_name' => $account->account_name,
                'account_type' => $account->account_type,
                'avatar_url' => $account->avatar_url,
                'connection_status' => $account->connection_status,
                'expires_at' => $account->expires_at?->toIso8601String(),
                'is_expired' => $account->isExpired(),
                'last_synced_at' => $account->last_synced_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total' => $totalAccounts,
                    'connected' => $connectedCount,
                    'expired' => $expiredCount,
                ],
                'accounts' => $accounts,
            ],
        ]);
    }
}

