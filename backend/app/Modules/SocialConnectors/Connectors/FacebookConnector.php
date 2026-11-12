<?php

namespace App\Modules\SocialConnectors\Connectors;

use App\Modules\SocialConnectors\Contracts\SocialConnectorInterface;
use App\Modules\ControlPlane\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class FacebookConnector implements SocialConnectorInterface
{
    protected string $appId;
    protected string $appSecret;
    protected string $graphVersion;
    protected string $baseUrl;

    public function __construct()
    {
        $this->appId = SystemSetting::where('key', 'meta_app_id')->value('value') ?? config('services.meta.app_id') ?? env('META_APP_ID', 'mock_fb_app_id');
        $this->appSecret = SystemSetting::where('key', 'meta_app_secret')->value('value') ?? config('services.meta.app_secret') ?? env('META_APP_SECRET', 'mock_fb_app_secret');
        $this->graphVersion = SystemSetting::where('key', 'meta_graph_version')->value('value') ?? config('services.meta.graph_version', 'v21.0');
        $this->baseUrl = "https://graph.facebook.com/{$this->graphVersion}";
    }

    public function getPlatform(): string
    {
        return 'facebook';
    }

    public function getAuthorizationUrl(string $state, array $options = []): string
    {
        $redirectUri = $options['redirect_uri'] ?? config('services.meta.redirect_uri') ?? url('/oauth/social/facebook/callback');
        $hasValidAppId = !empty($this->appId) && !str_starts_with($this->appId, 'mock_');

        if (!$hasValidAppId) {
            return url("/oauth/social/facebook/callback?code=sandbox_sim_code&state={$state}");
        }

        $scopes = $options['scopes'] ?? [
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
            'public_profile',
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
        if ($code === 'sandbox_sim_code' || str_starts_with($this->appId, 'mock_') || empty($this->appId)) {
            return [
                'access_token' => 'sandbox_verified_token_' . bin2hex(random_bytes(16)),
                'refresh_token' => null,
                'provider_id' => 'sb_page_' . rand(100000, 999999),
                'account_name' => 'AutoCanvas Global Official (Sandbox)',
                'account_type' => 'page',
                'avatar_url' => null,
                'expires_at' => Carbon::now()->addDays(60),
                'scopes' => ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
                'metadata' => ['is_sandbox' => true, 'connected_at' => now()->toIso8601String()],
            ];
        }

        // 1. Exchange authorization code for short-lived user access token
        $tokenRes = Http::timeout(15)->get("{$this->baseUrl}/oauth/access_token", [
            'client_id' => $this->appId,
            'client_secret' => $this->appSecret,
            'redirect_uri' => $redirectUri,
            'code' => $code,
        ]);

        if (!$tokenRes->successful()) {
            throw new RuntimeException("Facebook OAuth exchange failed: " . ($tokenRes->json('error.message') ?? $tokenRes->body()));
        }

        $shortLivedToken = $tokenRes->json('access_token');

        // 2. Exchange for 60-day long-lived user access token
        $longLivedRes = Http::timeout(15)->get("{$this->baseUrl}/oauth/access_token", [
            'grant_type' => 'fb_exchange_token',
            'client_id' => $this->appId,
            'client_secret' => $this->appSecret,
            'fb_exchange_token' => $shortLivedToken,
        ]);

        $userToken = $longLivedRes->successful() ? $longLivedRes->json('access_token') : $shortLivedToken;
        $expiresIn = $longLivedRes->json('expires_in') ?? 5184000; // 60 days default

        // 3. Fetch connected pages to obtain perpetual Page Access Token
        $accountsRes = Http::timeout(15)->withToken($userToken)->get("{$this->baseUrl}/me/accounts", [
            'fields' => 'id,name,access_token,category,picture',
        ]);

        $pages = $accountsRes->json('data') ?? [];
        $selectedPage = $pages[0] ?? null;

        if ($selectedPage) {
            return [
                'access_token' => $selectedPage['access_token'],
                'refresh_token' => null, // Page access tokens do not expire unless user revokes permissions
                'provider_id' => (string) $selectedPage['id'],
                'account_name' => $selectedPage['name'] ?? 'Facebook Page',
                'account_type' => 'page',
                'avatar_url' => $selectedPage['picture']['data']['url'] ?? null,
                'expires_at' => Carbon::now()->addDays(60),
                'scopes' => ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
                'metadata' => [
                    'page_id' => $selectedPage['id'],
                    'category' => $selectedPage['category'] ?? null,
                    'user_token' => $userToken,
                ],
            ];
        }

        // Fallback to User profile if no page found
        $profile = $this->fetchAccountProfile($userToken);
        return [
            'access_token' => $userToken,
            'refresh_token' => null,
            'provider_id' => (string) ($profile['id'] ?? 'fb_user_' . uniqid()),
            'account_name' => $profile['name'] ?? 'Facebook User',
            'account_type' => 'profile',
            'avatar_url' => $profile['picture']['data']['url'] ?? null,
            'expires_at' => Carbon::now()->addSeconds($expiresIn),
            'scopes' => ['public_profile'],
            'metadata' => ['user_token' => $userToken],
        ];
    }

    public function refreshToken(string $refreshToken): array
    {
        // Meta page tokens are refreshed by re-exchanging with fb_exchange_token
        $res = Http::timeout(15)->get("{$this->baseUrl}/oauth/access_token", [
            'grant_type' => 'fb_exchange_token',
            'client_id' => $this->appId,
            'client_secret' => $this->appSecret,
            'fb_exchange_token' => $refreshToken,
        ]);

        if (!$res->successful()) {
            throw new RuntimeException("Facebook token refresh failed: " . ($res->json('error.message') ?? $res->body()));
        }

        return [
            'access_token' => $res->json('access_token'),
            'expires_at' => Carbon::now()->addSeconds($res->json('expires_in', 5184000)),
        ];
    }

    public function validateToken(string $accessToken): bool
    {
        $res = Http::timeout(10)->get("{$this->baseUrl}/debug_token", [
            'input_token' => $accessToken,
            'access_token' => "{$this->appId}|{$this->appSecret}",
        ]);

        if ($res->successful()) {
            return (bool) $res->json('data.is_valid', false);
        }

        return false;
    }

    public function fetchAccountProfile(string $accessToken, ?string $accountId = null): array
    {
        $target = $accountId ?? 'me';
        $res = Http::timeout(10)->withToken($accessToken)->get("{$this->baseUrl}/{$target}", [
            'fields' => 'id,name,picture.type(large)',
        ]);

        return $res->json() ?? [];
    }

    public function publish(array $content, array $tokens): array
    {
        $token = $tokens['access_token'] ?? null;
        if (!$token) {
            throw new RuntimeException("Missing Facebook access token for publishing.");
        }

        $pageId = $tokens['provider_id'] ?? $tokens['platform_account_id'] ?? 'me';
        $text = $content['text'] ?? $content['message'] ?? $content['caption'] ?? '';
        $mediaUrl = $content['media_url'] ?? $content['image_url'] ?? null;

        if ($mediaUrl) {
            // Post single photo with caption
            $res = Http::timeout(25)->post("{$this->baseUrl}/{$pageId}/photos", [
                'access_token' => $token,
                'url' => $mediaUrl,
                'caption' => $text,
            ]);
        } else {
            // Post status feed update
            $res = Http::timeout(20)->post("{$this->baseUrl}/{$pageId}/feed", [
                'access_token' => $token,
                'message' => $text,
            ]);
        }

        if (!$res->successful()) {
            $errorMsg = $res->json('error.message') ?? $res->body();
            Log::error("Facebook publish error: {$errorMsg}", ['page_id' => $pageId]);
            throw new RuntimeException("Facebook publish failed: {$errorMsg}");
        }

        $postId = (string) ($res->json('id') ?? $res->json('post_id'));

        return [
            'status' => 'success',
            'platform' => 'facebook',
            'id' => $postId,
            'url' => "https://facebook.com/{$postId}",
            'published_at' => Carbon::now()->toIso8601String(),
        ];
    }
}
