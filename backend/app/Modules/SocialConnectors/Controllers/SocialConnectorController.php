<?php

namespace App\Modules\SocialConnectors\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\SocialConnectors\Models\SocialAccount;
use App\Modules\SocialConnectors\Services\OAuthManager;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class SocialConnectorController extends Controller
{
    public function __construct(
        protected OAuthManager $oauthManager
    ) {}

    /**
     * List all connected social accounts for the current tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->current_organization_id;
        $brandId = $request->query('brand_id');

        $query = SocialAccount::where('organization_id', $orgId);

        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        $accounts = $query->orderBy('platform')->get()->map(function (SocialAccount $account) {
            return [
                'id' => $account->id,
                'organization_id' => $account->organization_id,
                'workspace_id' => $account->workspace_id,
                'brand_id' => $account->brand_id,
                'platform' => $account->platform,
                'provider_id' => $account->provider_id,
                'account_name' => $account->account_name,
                'account_type' => $account->account_type,
                'avatar_url' => $account->avatar_url,
                'connection_status' => $account->connection_status,
                'is_active' => $account->is_active,
                'expires_at' => $account->expires_at?->toIso8601String(),
                'is_expired' => $account->isExpired(),
                'is_expiring_soon' => $account->isExpiringSoon(7),
                'scopes' => $account->scopes,
                'last_synced_at' => $account->last_synced_at?->toIso8601String(),
                'metadata' => $account->metadata,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $accounts,
        ]);
    }

    /**
     * Handle browser-based OAuth callback with HMAC verification and 302 redirect.
     */
    public function handleBrowserCallback(Request $request, string $platform): \Illuminate\Http\RedirectResponse
    {
        $code = $request->query('code');
        $state = $request->query('state');
        $error = $request->query('error_description') ?? $request->query('error');

        $frontendUrl = '/workspace/social';

        if ($error) {
            return redirect("{$frontendUrl}?error=" . urlencode($error));
        }

        if (!$code || !$state) {
            return redirect("{$frontendUrl}?error=" . urlencode('Missing required authorization parameters.'));
        }

        $stateData = $this->oauthManager->verifyState($state);
        if (!$stateData) {
            return redirect("{$frontendUrl}?error=" . urlencode('Invalid, expired, or tampered OAuth session. Please retry.'));
        }

        try {
            $redirectUri = url("/oauth/social/{$platform}/callback");
            $account = $this->oauthManager->handleCallback($platform, $code, $redirectUri, $stateData);

            return redirect("{$frontendUrl}?connected={$platform}&account=" . urlencode($account->account_name));
        } catch (\Throwable $e) {
            return redirect("{$frontendUrl}?error=" . urlencode('Token exchange failed: ' . $e->getMessage()));
        }
    }

    /**
     * Generate OAuth authorization URL with signed CSRF state.
     */
    public function oauthUrl(Request $request, string $platform): JsonResponse
    {
        if (!in_array(strtolower($platform), ['facebook', 'instagram', 'linkedin'], true)) {
            return response()->json([
                'success' => false,
                'message' => "Unsupported social platform: {$platform}",
            ], 422);
        }

        $orgId = $request->user()->current_organization_id;
        $workspaceId = $request->query('workspace_id');
        $brandId = $request->query('brand_id');
        $redirectUri = $request->query('redirect_uri');

        $state = $this->oauthManager->generateState($orgId, $workspaceId, $brandId, $platform);
        $options = $redirectUri ? ['redirect_uri' => $redirectUri] : [];
        $url = $this->oauthManager->getAuthorizationUrl($platform, $state, $options);

        return response()->json([
            'success' => true,
            'data' => [
                'platform' => $platform,
                'authorization_url' => $url,
                'state' => $state,
            ],
        ]);
    }

    /**
     * Direct Enterprise Token & Page ID Binding (Bypasses Meta App Review).
     */
    public function bindDirect(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'platform' => 'required|in:facebook,instagram,linkedin',
            'access_token' => 'required|string',
            'provider_id' => 'nullable|string|max:100',
            'account_name' => 'nullable|string|max:255',
            'account_type' => 'nullable|string|in:page,profile,business,organization',
            'brand_id' => 'nullable|string',
        ]);

        $orgId = $request->user()->current_organization_id;
        $wsId = $request->user()->current_workspace_id;
        $platform = strtolower($validated['platform']);
        $token = trim($validated['access_token']);

        // 1. Introspect token against real platform API
        $connector = $this->oauthManager->getConnector($platform);
        $profileData = $connector->introspectToken($token, $validated['provider_id'] ?? null);

        $providerId = !empty($validated['provider_id']) ? $validated['provider_id'] : ($profileData['id'] ?? 'dir_' . bin2hex(random_bytes(6)));
        $accountName = !empty($validated['account_name']) ? $validated['account_name'] : ($profileData['name'] ?? ucfirst($platform) . ' Channel');
        $avatarUrl = $profileData['avatar_url'] ?? null;
        $accountType = !empty($validated['account_type']) ? $validated['account_type'] : ($profileData['account_type'] ?? 'page');

        // 2. Persist encrypted SocialAccount
        $account = SocialAccount::updateOrCreate(
            [
                'organization_id' => $orgId,
                'platform' => $platform,
                'provider_id' => (string) $providerId,
            ],
            [
                'workspace_id' => $wsId,
                'brand_id' => $validated['brand_id'] ?? null,
                'account_name' => $accountName,
                'account_type' => $accountType,
                'avatar_url' => $avatarUrl,
                'access_token' => $token,
                'refresh_token' => null,
                'expires_at' => $profileData['expires_at'] ?? Carbon::now()->addDays(90),
                'scopes' => $profileData['scopes'] ?? ['publish_actions'],
                'is_active' => true,
                'connection_status' => 'connected',
                'metadata' => [
                    'binding_method' => 'direct_token',
                    'bound_by_user_id' => $request->user()->id,
                    'bound_at' => Carbon::now()->toIso8601String(),
                ],
                'last_synced_at' => Carbon::now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Successfully bound {$platform} account: {$account->account_name}",
            'data' => [
                'id' => $account->id,
                'platform' => $account->platform,
                'account_name' => $account->account_name,
                'provider_id' => $account->provider_id,
                'account_type' => $account->account_type,
                'avatar_url' => $account->avatar_url,
                'connection_status' => $account->connection_status,
                'is_active' => $account->is_active,
                'expires_at' => $account->expires_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Process OAuth callback, exchange code, and persist encrypted credentials.
     */
    public function callback(Request $request, string $platform): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'state' => 'required|string',
            'redirect_uri' => 'nullable|string',
        ]);

        $stateData = $this->oauthManager->verifyState($validated['state']);
        if (!$stateData) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid, expired, or tampered OAuth state parameter.',
            ], 403);
        }

        // Verify the authenticated user belongs to the state's organization
        if ($request->user()->current_organization_id !== $stateData['org_id'] && !$request->user()->is_platform_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized organization mismatch.',
            ], 403);
        }

        $redirectUri = $validated['redirect_uri'] ?? url("/api/v1/social/connectors/{$platform}/callback");

        try {
            $account = $this->oauthManager->handleCallback(
                $platform,
                $validated['code'],
                $redirectUri,
                $stateData
            );

            return response()->json([
                'success' => true,
                'message' => "Successfully connected {$platform} account: {$account->account_name}",
                'data' => [
                    'id' => $account->id,
                    'platform' => $account->platform,
                    'account_name' => $account->account_name,
                    'account_type' => $account->account_type,
                    'avatar_url' => $account->avatar_url,
                    'connection_status' => $account->connection_status,
                    'expires_at' => $account->expires_at?->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'OAuth token exchange failed: ' . $e->getMessage(),
            ], 502);
        }
    }

    /**
     * Force refresh/validation of account tokens.
     */
    public function refresh(Request $request, string $accountId): JsonResponse
    {
        $orgId = $request->user()->current_organization_id;
        $account = SocialAccount::where('organization_id', $orgId)->findOrFail($accountId);

        try {
            $refreshed = $this->oauthManager->refreshAccountToken($account);

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully.',
                'data' => [
                    'id' => $refreshed->id,
                    'connection_status' => $refreshed->connection_status,
                    'expires_at' => $refreshed->expires_at?->toIso8601String(),
                    'last_synced_at' => $refreshed->last_synced_at?->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Test connection validity on remote platform API.
     */
    public function testConnection(Request $request, string $accountId): JsonResponse
    {
        $orgId = $request->user()->current_organization_id;
        $account = SocialAccount::where('organization_id', $orgId)->findOrFail($accountId);

        $isValid = $this->oauthManager->testConnection($account);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $account->id,
                'platform' => $account->platform,
                'account_name' => $account->account_name,
                'is_valid' => $isValid,
                'connection_status' => $account->connection_status,
            ],
        ]);
    }

    /**
     * Disconnect and remove a social account.
     */
    public function destroy(Request $request, string $accountId): JsonResponse
    {
        $orgId = $request->user()->current_organization_id;
        $account = SocialAccount::where('organization_id', $orgId)->findOrFail($accountId);

        $account->delete();

        return response()->json([
            'success' => true,
            'message' => 'Social account disconnected successfully.',
        ]);
    }
}

