<?php

namespace App\Modules\SocialConnectors\Connectors;

use App\Modules\SocialConnectors\Contracts\SocialConnectorInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class LinkedInConnector implements SocialConnectorInterface
{
    protected string $clientId;
    protected string $clientSecret;
    protected string $authUrl = 'https://www.linkedin.com/oauth/v2/authorization';
    protected string $tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    protected string $apiBaseUrl = 'https://api.linkedin.com';

    public function __construct()
    {
        $this->clientId = config('services.linkedin.client_id') ?? env('LINKEDIN_CLIENT_ID', 'mock_li_client_id');
        $this->clientSecret = config('services.linkedin.client_secret') ?? env('LINKEDIN_CLIENT_SECRET', 'mock_li_client_secret');
    }

    public function getPlatform(): string
    {
        return 'linkedin';
    }

    public function getAuthorizationUrl(string $state, array $options = []): string
    {
        $redirectUri = $options['redirect_uri'] ?? config('services.linkedin.redirect_uri') ?? url('/api/v1/social/connectors/linkedin/callback');
        $scopes = $options['scopes'] ?? [
            'openid',
            'profile',
            'email',
            'w_member_social',
        ];

        $params = http_build_query([
            'response_type' => 'code',
            'client_id' => $this->clientId,
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'scope' => implode(' ', $scopes),
        ]);

        return "{$this->authUrl}?{$params}";
    }

    public function exchangeCodeForTokens(string $code, string $redirectUri): array
    {
        $res = Http::asForm()->timeout(15)->post($this->tokenUrl, [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'redirect_uri' => $redirectUri,
        ]);

        if (!$res->successful()) {
            throw new RuntimeException("LinkedIn OAuth exchange failed: " . ($res->json('error_description') ?? $res->body()));
        }

        $accessToken = $res->json('access_token');
        $refreshToken = $res->json('refresh_token');
        $expiresIn = $res->json('expires_in', 5184000); // 60 days default

        // Retrieve user profile via OpenID UserInfo endpoint
        $profile = $this->fetchAccountProfile($accessToken);
        $sub = $profile['sub'] ?? 'li_' . uniqid();
        $name = $profile['name'] ?? 'LinkedIn Member';
        $picture = $profile['picture'] ?? null;

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'provider_id' => (string) $sub,
            'account_name' => $name,
            'account_type' => 'profile',
            'avatar_url' => $picture,
            'expires_at' => Carbon::now()->addSeconds($expiresIn),
            'scopes' => ['openid', 'profile', 'w_member_social'],
            'metadata' => [
                'sub' => $sub,
                'email' => $profile['email'] ?? null,
                'author_urn' => "urn:li:person:{$sub}",
            ],
        ];
    }

    public function refreshToken(string $refreshToken): array
    {
        $res = Http::asForm()->timeout(15)->post($this->tokenUrl, [
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
        ]);

        if (!$res->successful()) {
            throw new RuntimeException("LinkedIn token refresh failed: " . ($res->json('error_description') ?? $res->body()));
        }

        return [
            'access_token' => $res->json('access_token'),
            'refresh_token' => $res->json('refresh_token') ?? $refreshToken,
            'expires_at' => Carbon::now()->addSeconds($res->json('expires_in', 5184000)),
        ];
    }

    public function validateToken(string $accessToken): bool
    {
        $res = Http::timeout(10)->withToken($accessToken)->get("{$this->apiBaseUrl}/v2/userinfo");
        return $res->successful();
    }

    public function fetchAccountProfile(string $accessToken, ?string $accountId = null): array
    {
        $res = Http::timeout(10)->withToken($accessToken)->get("{$this->apiBaseUrl}/v2/userinfo");
        return $res->json() ?? [];
    }

    public function publish(array $content, array $tokens): array
    {
        $token = $tokens['access_token'] ?? null;
        if (!$token) {
            throw new RuntimeException("Missing LinkedIn access token.");
        }

        $authorUrn = $tokens['metadata']['author_urn']
            ?? ("urn:li:person:" . ($tokens['provider_id'] ?? 'me'));

        $text = $content['text'] ?? $content['message'] ?? $content['caption'] ?? '';
        $mediaUrl = $content['media_url'] ?? $content['image_url'] ?? null;

        $payload = [
            'author' => $authorUrn,
            'lifecycleState' => 'PUBLISHED',
            'specificContent' => [
                'com.linkedin.ugc.ShareContent' => [
                    'shareCommentary' => [
                        'text' => $text,
                    ],
                    'shareMediaCategory' => $mediaUrl ? 'ARTICLE' : 'NONE',
                ],
            ],
            'visibility' => [
                'com.linkedin.ugc.MemberNetworkVisibility' => 'PUBLIC',
            ],
        ];

        if ($mediaUrl) {
            $payload['specificContent']['com.linkedin.ugc.ShareContent']['media'] = [
                [
                    'status' => 'READY',
                    'originalUrl' => $mediaUrl,
                    'title' => [
                        'text' => $content['title'] ?? substr($text, 0, 50),
                    ],
                ],
            ];
        }

        $res = Http::timeout(25)
            ->withToken($token)
            ->withHeaders([
                'X-Restli-Protocol-Version' => '2.0.0',
            ])
            ->post("{$this->apiBaseUrl}/v2/ugcPosts", $payload);

        if (!$res->successful()) {
            $err = $res->json('message') ?? $res->body();
            Log::error("LinkedIn publish error: {$err}", ['author' => $authorUrn]);
            throw new RuntimeException("LinkedIn publish failed: {$err}");
        }

        $postId = (string) ($res->header('x-restli-id') ?? $res->json('id') ?? 'urn:li:share:' . uniqid());

        return [
            'status' => 'success',
            'platform' => 'linkedin',
            'id' => $postId,
            'url' => "https://www.linkedin.com/feed/update/{$postId}",
            'published_at' => Carbon::now()->toIso8601String(),
        ];
    }
}
