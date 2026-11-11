<?php

namespace App\Modules\SocialConnectors\Services;

use App\Modules\SocialConnectors\Connectors\FacebookConnector;
use App\Modules\SocialConnectors\Connectors\InstagramConnector;
use App\Modules\SocialConnectors\Connectors\LinkedInConnector;
use App\Modules\SocialConnectors\Contracts\SocialConnectorInterface;
use App\Modules\SocialConnectors\Models\SocialAccount;
use Carbon\Carbon;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class OAuthManager
{
    /**
     * Resolve connector instance for platform.
     */
    public function getConnector(string $platform): SocialConnectorInterface
    {
        return match (strtolower($platform)) {
            'facebook' => new FacebookConnector(),
            'instagram' => new InstagramConnector(),
            'linkedin' => new LinkedInConnector(),
            default => throw new InvalidArgumentException("Unsupported social platform: {$platform}"),
        };
    }

    /**
     * Generate HMAC-signed state token preventing CSRF and capturing tenant routing metadata.
     */
    public function generateState(string $organizationId, ?string $workspaceId, ?string $brandId, string $platform): string
    {
        $payload = [
            'org_id' => $organizationId,
            'ws_id' => $workspaceId,
            'brand_id' => $brandId,
            'platform' => $platform,
            'ts' => time(),
            'nonce' => Str::random(16),
        ];

        $json = json_encode($payload, JSON_THROW_ON_ERROR);
        $encoded = rtrim(strtr(base64_encode($json), '+/', '-_'), '=');
        $sig = hash_hmac('sha256', $encoded, config('app.key', 'secret_key'));

        return "{$encoded}.{$sig}";
    }

    /**
     * Verify state token integrity and expiry (< 15 mins).
     */
    public function verifyState(string $stateString): ?array
    {
        $parts = explode('.', $stateString);
        if (count($parts) !== 2) {
            return null;
        }

        [$encoded, $signature] = $parts;
        $expectedSig = hash_hmac('sha256', $encoded, config('app.key', 'secret_key'));

        if (!hash_equals($expectedSig, $signature)) {
            return null;
        }

        $json = base64_decode(strtr($encoded, '-_', '+/'));
        if (!$json) {
            return null;
        }

        $payload = json_decode($json, true);
        if (!$payload || !isset($payload['ts'])) {
            return null;
        }

        // Expire state after 15 minutes (900 seconds)
        if (time() - $payload['ts'] > 900) {
            return null;
        }

        return $payload;
    }

    /**
     * Generate platform-specific OAuth authorization URL.
     */
    public function getAuthorizationUrl(string $platform, string $state, array $options = []): string
    {
        $connector = $this->getConnector($platform);
        return $connector->getAuthorizationUrl($state, $options);
    }

    /**
     * Exchange auth code for tokens and persist envelope-encrypted social account.
     */
    public function handleCallback(string $platform, string $code, string $redirectUri, array $stateData): SocialAccount
    {
        $connector = $this->getConnector($platform);
        $tokenData = $connector->exchangeCodeForTokens($code, $redirectUri);

        $orgId = $stateData['org_id'];
        $wsId = $stateData['ws_id'] ?? null;
        $brandId = $stateData['brand_id'] ?? null;

        return SocialAccount::updateOrCreate(
            [
                'organization_id' => $orgId,
                'platform' => $platform,
                'provider_id' => $tokenData['provider_id'],
            ],
            [
                'workspace_id' => $wsId,
                'brand_id' => $brandId,
                'account_name' => $tokenData['account_name'] ?? ucfirst($platform) . ' Account',
                'account_type' => $tokenData['account_type'] ?? 'page',
                'avatar_url' => $tokenData['avatar_url'] ?? null,
                'access_token' => $tokenData['access_token'],
                'refresh_token' => $tokenData['refresh_token'] ?? null,
                'expires_at' => $tokenData['expires_at'] ?? Carbon::now()->addDays(60),
                'scopes' => $tokenData['scopes'] ?? [],
                'metadata' => $tokenData['metadata'] ?? [],
                'is_active' => true,
                'connection_status' => 'connected',
                'last_synced_at' => Carbon::now(),
            ]
        );
    }

    /**
     * Refresh access token for a connected social account.
     */
    public function refreshAccountToken(SocialAccount $account): SocialAccount
    {
        $connector = $this->getConnector($account->platform);

        if (empty($account->refresh_token)) {
            // For Meta (Facebook/Instagram), if no refresh token, validate current token
            $isValid = $connector->validateToken($account->access_token);
            if (!$isValid) {
                $account->update(['connection_status' => 'expired']);
                throw new RuntimeException("Social token for {$account->platform} is invalid or expired. Re-authorization required.");
            }
            $account->update(['last_synced_at' => Carbon::now()]);
            return $account;
        }

        $renewed = $connector->refreshToken($account->refresh_token);

        $account->update([
            'access_token' => $renewed['access_token'],
            'refresh_token' => $renewed['refresh_token'] ?? $account->refresh_token,
            'expires_at' => $renewed['expires_at'] ?? Carbon::now()->addDays(60),
            'connection_status' => 'connected',
            'last_synced_at' => Carbon::now(),
        ]);

        return $account;
    }

    /**
     * Test token validity against remote platform API.
     */
    public function testConnection(SocialAccount $account): bool
    {
        try {
            $connector = $this->getConnector($account->platform);
            $isValid = $connector->validateToken($account->access_token);

            $account->update([
                'connection_status' => $isValid ? 'connected' : 'expired',
                'last_synced_at' => Carbon::now(),
            ]);

            return $isValid;
        } catch (\Throwable $e) {
            $account->update(['connection_status' => 'expired']);
            return false;
        }
    }

    /**
     * Store token directly (legacy compatibility).
     */
    public function storeToken(string $organizationId, string $platform, string $providerId, string $accessToken, ?string $refreshToken, ?string $expiresAt): SocialAccount
    {
        return SocialAccount::updateOrCreate(
            ['organization_id' => $organizationId, 'platform' => $platform, 'provider_id' => $providerId],
            [
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'expires_at' => $expiresAt,
                'connection_status' => 'connected',
                'is_active' => true,
            ]
        );
    }
}
