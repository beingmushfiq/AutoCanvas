<?php

namespace App\Modules\SocialConnectors\Connectors;

use App\Modules\SocialConnectors\Contracts\SocialConnectorInterface;
use App\Modules\ControlPlane\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class InstagramConnector implements SocialConnectorInterface
{
    protected string $appId;
    protected string $appSecret;
    protected string $graphVersion;
    protected string $baseUrl;

    public function __construct()
    {
        $this->appId = SystemSetting::where('key', 'meta_app_id')->value('value') ?? config('services.meta.app_id') ?? env('META_APP_ID', 'mock_ig_app_id');
        $this->appSecret = SystemSetting::where('key', 'meta_app_secret')->value('value') ?? config('services.meta.app_secret') ?? env('META_APP_SECRET', 'mock_ig_app_secret');
        $this->graphVersion = SystemSetting::where('key', 'meta_graph_version')->value('value') ?? config('services.meta.graph_version', 'v21.0');
        $this->baseUrl = "https://graph.facebook.com/{$this->graphVersion}";
    }

    public function getPlatform(): string
    {
        return 'instagram';
    }

    public function getAuthorizationUrl(string $state, array $options = []): string
    {
        $redirectUri = $options['redirect_uri'] ?? config('services.meta.redirect_uri') ?? url('/oauth/social/instagram/callback');
        $hasValidAppId = !empty($this->appId) && !str_starts_with($this->appId, 'mock_');

        if (!$hasValidAppId) {
            if (app()->environment('testing')) {
                return url("/oauth/social/instagram/callback?code=sandbox_sim_code&state={$state}");
            }
            throw new RuntimeException("Official Instagram OAuth requires configured Meta App credentials (App ID & Secret). Please configure App Keys in Settings or use Direct Token Binding.");
        }

        $scopes = $options['scopes'] ?? [
            'instagram_basic',
            'instagram_content_publish',
            'pages_show_list',
            'pages_read_engagement',
        ];

        $params = http_build_query([
            'client_id' => $this->appId,
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'scope' => implode(',', $scopes),
            'response_type' => 'code',
        ]);

        return "https://www.facebook.com/{$this->graphVersion}/dialog/oauth?{$params}";
    }

    public function exchangeCodeForTokens(string $code, string $redirectUri): array
    {
        if ($code === 'sandbox_sim_code') {
            return [
                'access_token' => 'sandbox_verified_token_' . bin2hex(random_bytes(16)),
                'refresh_token' => null,
                'provider_id' => 'sb_ig_' . rand(100000, 999999),
                'account_name' => 'AutoCanvas Professional IG (Sandbox)',
                'account_type' => 'business',
                'avatar_url' => null,
                'expires_at' => Carbon::now()->addDays(60),
                'scopes' => ['instagram_basic', 'instagram_content_publish'],
                'metadata' => ['is_sandbox' => true, 'connected_at' => now()->toIso8601String()],
            ];
        }

        // 1. Exchange code for user token
        $tokenRes = Http::timeout(15)->get("{$this->baseUrl}/oauth/access_token", [
            'client_id' => $this->appId,
            'client_secret' => $this->appSecret,
            'redirect_uri' => $redirectUri,
            'code' => $code,
        ]);

        if (!$tokenRes->successful()) {
            throw new RuntimeException("Instagram OAuth exchange failed: " . ($tokenRes->json('error.message') ?? $tokenRes->body()));
        }

        $shortLivedToken = $tokenRes->json('access_token');

        // 2. Exchange for 60-day long-lived token
        $longLivedRes = Http::timeout(15)->get("{$this->baseUrl}/oauth/access_token", [
            'grant_type' => 'fb_exchange_token',
            'client_id' => $this->appId,
            'client_secret' => $this->appSecret,
            'fb_exchange_token' => $shortLivedToken,
        ]);

        $userToken = $longLivedRes->successful() ? $longLivedRes->json('access_token') : $shortLivedToken;

        // 3. Query pages for connected Instagram Business accounts
        $accountsRes = Http::timeout(15)->withToken($userToken)->get("{$this->baseUrl}/me/accounts", [
            'fields' => 'id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}',
        ]);

        $pages = $accountsRes->json('data') ?? [];
        foreach ($pages as $page) {
            if (!empty($page['instagram_business_account'])) {
                $ig = $page['instagram_business_account'];
                return [
                    'access_token' => $page['access_token'], // Page token used to manage connected IG business account
                    'refresh_token' => null,
                    'provider_id' => (string) $ig['id'],
                    'account_name' => $ig['username'] ?? $ig['name'] ?? 'Instagram Business',
                    'account_type' => 'business',
                    'avatar_url' => $ig['profile_picture_url'] ?? null,
                    'expires_at' => Carbon::now()->addDays(60),
                    'scopes' => ['instagram_basic', 'instagram_content_publish'],
                    'metadata' => [
                        'page_id' => $page['id'],
                        'ig_user_id' => $ig['id'],
                        'username' => $ig['username'] ?? null,
                        'user_token' => $userToken,
                    ],
                ];
            }
        }

        // If no IG business account found attached to page, create fallback handle
        return [
            'access_token' => $userToken,
            'refresh_token' => null,
            'provider_id' => 'ig_pending_' . uniqid(),
            'account_name' => 'Instagram Professional (Pending Business Link)',
            'account_type' => 'business',
            'avatar_url' => null,
            'expires_at' => Carbon::now()->addDays(60),
            'scopes' => ['instagram_basic'],
            'metadata' => ['user_token' => $userToken],
        ];
    }

    public function refreshToken(string $refreshToken): array
    {
        $res = Http::timeout(15)->get("{$this->baseUrl}/oauth/access_token", [
            'grant_type' => 'fb_exchange_token',
            'client_id' => $this->appId,
            'client_secret' => $this->appSecret,
            'fb_exchange_token' => $refreshToken,
        ]);

        if (!$res->successful()) {
            throw new RuntimeException("Instagram token refresh failed: " . ($res->json('error.message') ?? $res->body()));
        }

        return [
            'access_token' => $res->json('access_token'),
            'expires_at' => Carbon::now()->addSeconds($res->json('expires_in', 5184000)),
        ];
    }

    public function validateToken(string $accessToken): bool
    {
        // 1. Direct validation via authenticated API call (works for ANY token, no app secret required!)
        try {
            $res = Http::timeout(10)->withToken($accessToken)->get("{$this->baseUrl}/me", [
                'fields' => 'id,name',
            ]);
            if ($res->successful() && !empty($res->json('id'))) {
                return true;
            }
        } catch (\Throwable) {}

        // 2. Fallback to debug_token only if real app credentials exist
        $hasValidApp = !empty($this->appId) && !str_starts_with($this->appId, 'mock_') && !empty($this->appSecret) && !str_starts_with($this->appSecret, 'mock_');
        if ($hasValidApp) {
            try {
                $res = Http::timeout(10)->get("{$this->baseUrl}/debug_token", [
                    'input_token' => $accessToken,
                    'access_token' => "{$this->appId}|{$this->appSecret}",
                ]);

                if ($res->successful()) {
                    return (bool) $res->json('data.is_valid', false);
                }
            } catch (\Throwable) {}
        }

        return false;
    }

    public function fetchAccountProfile(string $accessToken, ?string $accountId = null): array
    {
        $target = $accountId ?? 'me';
        $res = Http::timeout(10)->withToken($accessToken)->get("{$this->baseUrl}/{$target}", [
            'fields' => 'id,username,name,profile_picture_url,followers_count,media_count',
        ]);

        return $res->json() ?? [];
    }

    /**
     * Discover all connected Instagram Business accounts linked to Facebook Pages managed by this token.
     */
    public function discoverAccounts(string $token): array
    {
        $discovered = [];

        // 1. Check if token itself directly represents a Facebook Page with an attached IG Business Account
        try {
            $meRes = Http::timeout(10)->withToken($token)->get("{$this->baseUrl}/me", [
                'fields' => 'id,name,instagram_business_account{id,username,name,profile_picture_url}',
            ]);
            if ($meRes->successful()) {
                $me = $meRes->json();
                if (!empty($me['instagram_business_account'])) {
                    $ig = $me['instagram_business_account'];
                    $discovered[] = [
                        'id' => (string) $ig['id'],
                        'username' => $ig['username'] ?? $ig['name'] ?? 'instagram_business',
                        'name' => '@' . ($ig['username'] ?? $ig['name'] ?? 'instagram_business'),
                        'avatar_url' => $ig['profile_picture_url'] ?? null,
                        'access_token' => $token,
                        'account_type' => 'business',
                        'page_id' => $me['id'] ?? null,
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Instagram discover /me error: " . $e->getMessage());
        }

        // 2. Query /me/accounts for all connected pages and find their linked Instagram Business Accounts
        try {
            $accountsRes = Http::timeout(12)->withToken($token)->get("{$this->baseUrl}/me/accounts", [
                'fields' => 'id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}',
            ]);
            if ($accountsRes->successful()) {
                $pages = $accountsRes->json('data') ?? [];
                foreach ($pages as $p) {
                    if (!empty($p['instagram_business_account'])) {
                        $ig = $p['instagram_business_account'];
                        $igId = (string) $ig['id'];
                        $alreadyFound = false;
                        foreach ($discovered as $d) {
                            if ($d['id'] === $igId) {
                                $alreadyFound = true;
                                break;
                            }
                        }
                        if (!$alreadyFound) {
                            $discovered[] = [
                                'id' => $igId,
                                'username' => $ig['username'] ?? $ig['name'] ?? 'instagram_business',
                                'name' => '@' . ($ig['username'] ?? $ig['name'] ?? 'instagram_business'),
                                'avatar_url' => $ig['profile_picture_url'] ?? null,
                                'access_token' => $p['access_token'] ?? $token, // Use Page token for IG API operations
                                'account_type' => 'business',
                                'page_id' => $p['id'],
                                'page_name' => $p['name'],
                            ];
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Instagram discover /me/accounts error: " . $e->getMessage());
        }

        return $discovered;
    }

    public function introspectToken(string $token, ?string $providerId = null): array
    {
        // 1. If provider_id explicitly specified, try direct node lookup
        if (!empty($providerId)) {
            try {
                $res = Http::timeout(10)->withToken($token)->get("{$this->baseUrl}/{$providerId}", [
                    'fields' => 'id,username,name,profile_picture_url',
                ]);
                if ($res->successful()) {
                    $data = $res->json();
                    return [
                        'id' => (string) $data['id'],
                        'name' => '@' . ($data['username'] ?? $data['name'] ?? 'instagram_business'),
                        'avatar_url' => $data['profile_picture_url'] ?? null,
                        'account_type' => 'business',
                        'access_token' => $token,
                        'scopes' => ['instagram_basic', 'instagram_content_publish'],
                        'expires_at' => Carbon::now()->addDays(90),
                        'metadata' => [
                            'username' => $data['username'] ?? null,
                            'discovered_via' => 'direct_ig_lookup',
                        ],
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning("Instagram direct node lookup failed: " . $e->getMessage());
            }
        }

        // 2. Discover accounts automatically via attached Facebook Pages
        $accounts = $this->discoverAccounts($token);
        if (!empty($accounts)) {
            $selected = null;
            if (!empty($providerId)) {
                foreach ($accounts as $a) {
                    if ((string)$a['id'] === (string)$providerId || (string)$a['page_id'] === (string)$providerId) {
                        $selected = $a;
                        break;
                    }
                }
            }
            if (!$selected) {
                $selected = $accounts[0];
            }

            return [
                'id' => (string) $selected['id'],
                'name' => $selected['name'] ?? 'Instagram Business',
                'avatar_url' => $selected['avatar_url'] ?? null,
                'account_type' => 'business',
                'access_token' => $selected['access_token'] ?? $token,
                'scopes' => ['instagram_basic', 'instagram_content_publish'],
                'expires_at' => Carbon::now()->addDays(90),
                'metadata' => [
                    'username' => $selected['username'] ?? null,
                    'page_id' => $selected['page_id'] ?? null,
                    'total_accounts_discovered' => count($accounts),
                    'discovered_via' => 'page_link_autodiscovery',
                ],
            ];
        }

        // 3. Fallback to /me (direct user profile)
        try {
            $meRes = Http::timeout(10)->withToken($token)->get("{$this->baseUrl}/me", [
                'fields' => 'id,name,picture.type(large)',
            ]);
            if ($meRes->successful()) {
                $me = $meRes->json();
                return [
                    'id' => (string) ($providerId ?: ($me['id'] ?? 'ig_' . uniqid())),
                    'name' => $me['name'] ?? 'Instagram Professional Profile',
                    'avatar_url' => $me['picture']['data']['url'] ?? null,
                    'account_type' => 'business',
                    'access_token' => $token,
                    'scopes' => ['instagram_basic', 'instagram_content_publish'],
                    'expires_at' => Carbon::now()->addDays(90),
                    'metadata' => ['discovered_via' => 'user_profile_fallback'],
                ];
            }
        } catch (\Throwable $e) {
            Log::warning("Instagram /me fallback error: " . $e->getMessage());
        }

        return [
            'id' => $providerId ?: 'ig_' . uniqid(),
            'name' => 'Instagram Professional Profile',
            'avatar_url' => null,
            'account_type' => 'business',
            'access_token' => $token,
            'scopes' => ['instagram_basic', 'instagram_content_publish'],
            'expires_at' => Carbon::now()->addDays(90),
            'metadata' => ['discovered_via' => 'fallback'],
        ];
    }

    public function publish(array $content, array $tokens): array
    {
        $token = $tokens['access_token'] ?? null;
        if (!$token) {
            throw new RuntimeException("Missing Instagram access token.");
        }

        $igUserId = $tokens['provider_id'] ?? $tokens['platform_account_id'] ?? null;
        if (!$igUserId) {
            throw new RuntimeException("Missing Instagram Business Account ID.");
        }

        $caption = $content['caption'] ?? $content['text'] ?? '';
        $imageUrl = $content['image_url'] ?? $content['media_url'] ?? null;

        if (!$imageUrl) {
            throw new RuntimeException("Instagram publishing requires an image or video asset URL.");
        }

        // STEP 1: Create Media Container
        $containerRes = Http::timeout(25)->post("{$this->baseUrl}/{$igUserId}/media", [
            'access_token' => $token,
            'image_url' => $imageUrl,
            'caption' => $caption,
        ]);

        if (!$containerRes->successful()) {
            $err = $containerRes->json('error.message') ?? $containerRes->body();
            Log::error("Instagram container creation failed: {$err}", ['ig_user_id' => $igUserId]);
            throw new RuntimeException("Instagram container creation failed: {$err}");
        }

        $containerId = $containerRes->json('id');

        // STEP 2: Poll Container Status (wait for FINISHED, max 3 attempts)
        $ready = false;
        for ($i = 0; $i < 3; $i++) {
            $statusRes = Http::timeout(10)->get("{$this->baseUrl}/{$containerId}", [
                'access_token' => $token,
                'fields' => 'status_code',
            ]);

            $statusCode = $statusRes->json('status_code');
            if ($statusCode === 'FINISHED' || empty($statusCode)) {
                $ready = true;
                break;
            } elseif ($statusCode === 'ERROR') {
                throw new RuntimeException("Instagram media processing error for container {$containerId}");
            }
            usleep(500000); // 500ms
        }

        // STEP 3: Publish Media Container
        $publishRes = Http::timeout(25)->post("{$this->baseUrl}/{$igUserId}/media_publish", [
            'access_token' => $token,
            'creation_id' => $containerId,
        ]);

        if (!$publishRes->successful()) {
            $err = $publishRes->json('error.message') ?? $publishRes->body();
            Log::error("Instagram media publish failed: {$err}", ['container_id' => $containerId]);
            throw new RuntimeException("Instagram publish failed: {$err}");
        }

        $mediaId = (string) $publishRes->json('id');

        return [
            'status' => 'success',
            'platform' => 'instagram',
            'id' => $mediaId,
            'url' => "https://instagram.com/p/{$mediaId}",
            'published_at' => Carbon::now()->toIso8601String(),
        ];
    }
}
