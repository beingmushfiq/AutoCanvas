<?php

namespace App\Modules\SocialConnectors\Connectors;

use App\Modules\SocialConnectors\Contracts\SocialConnectorInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class TwitterConnector implements SocialConnectorInterface
{
    protected string $clientId;
    protected string $clientSecret;
    protected string $authUrl = 'https://twitter.com/i/oauth2/authorize';
    protected string $tokenUrl = 'https://api.twitter.com/2/oauth2/token';
    protected string $apiBaseUrl = 'https://api.twitter.com/2';

    public function __construct()
    {
        $this->clientId = config('services.twitter.client_id') ?? env('TWITTER_CLIENT_ID', 'mock_twitter_client_id');
        $this->clientSecret = config('services.twitter.client_secret') ?? env('TWITTER_CLIENT_SECRET', 'mock_twitter_client_secret');
    }

    public function getPlatform(): string
    {
        return 'twitter';
    }

    public function getAuthorizationUrl(string $state, array $options = []): string
    {
        $redirectUri = $options['redirect_uri'] ?? config('services.twitter.redirect_uri') ?? url('/api/v1/social/connectors/twitter/callback');
        $scopes = $options['scopes'] ?? [
            'tweet.read',
            'tweet.write',
            'users.read',
            'offline.access',
        ];

        $params = http_build_query([
            'response_type' => 'code',
            'client_id' => $this->clientId,
            'redirect_uri' => $redirectUri,
            'scope' => implode(' ', $scopes),
            'state' => $state,
            'code_challenge' => 'challenge',
            'code_challenge_method' => 'plain',
        ]);

        return "{$this->authUrl}?{$params}";
    }

    public function exchangeCodeForTokens(string $code, string $redirectUri): array
    {
        try {
            $response = Http::asForm()
                ->withBasicAuth($this->clientId, $this->clientSecret)
                ->post($this->tokenUrl, [
                    'code' => $code,
                    'grant_type' => 'authorization_code',
                    'client_id' => $this->clientId,
                    'redirect_uri' => $redirectUri,
                    'code_verifier' => 'challenge',
                ]);

            if (!$response->successful()) {
                throw new RuntimeException("Failed to exchange Twitter code: " . $response->body());
            }

            $data = $response->json();
            $expiresIn = (int) ($data['expires_in'] ?? 7200);

            return [
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'expires_at' => Carbon::now()->addSeconds($expiresIn),
                'token_type' => $data['token_type'] ?? 'bearer',
                'raw_payload' => $data,
            ];
        } catch (\Throwable $e) {
            Log::error("[TwitterConnector] Token exchange error: " . $e->getMessage());
            throw new RuntimeException("Twitter token exchange failed: " . $e->getMessage());
        }
    }

    public function refreshToken(string $refreshToken): array
    {
        try {
            $response = Http::asForm()
                ->withBasicAuth($this->clientId, $this->clientSecret)
                ->post($this->tokenUrl, [
                    'refresh_token' => $refreshToken,
                    'grant_type' => 'refresh_token',
                    'client_id' => $this->clientId,
                ]);

            if (!$response->successful()) {
                throw new RuntimeException("Failed to refresh Twitter token: " . $response->body());
            }

            $data = $response->json();
            $expiresIn = (int) ($data['expires_in'] ?? 7200);

            return [
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? $refreshToken,
                'expires_at' => Carbon::now()->addSeconds($expiresIn),
            ];
        } catch (\Throwable $e) {
            Log::error("[TwitterConnector] Refresh token error: " . $e->getMessage());
            throw new RuntimeException("Twitter token refresh failed: " . $e->getMessage());
        }
    }

    public function validateToken(string $accessToken): bool
    {
        try {
            $response = Http::withToken($accessToken)
                ->get("{$this->apiBaseUrl}/users/me");

            return $response->successful();
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function fetchAccountProfile(string $accessToken, ?string $accountId = null): array
    {
        try {
            $response = Http::withToken($accessToken)
                ->get("{$this->apiBaseUrl}/users/me", [
                    'user.fields' => 'profile_image_url,description,public_metrics,username,name',
                ]);

            if (!$response->successful()) {
                throw new RuntimeException("Failed to fetch Twitter profile: " . $response->body());
            }

            $user = $response->json('data') ?? [];

            return [
                'provider_id' => $user['id'] ?? '',
                'username' => $user['username'] ?? '',
                'name' => $user['name'] ?? '',
                'avatar_url' => $user['profile_image_url'] ?? null,
                'metadata' => [
                    'followers_count' => $user['public_metrics']['followers_count'] ?? 0,
                    'following_count' => $user['public_metrics']['following_count'] ?? 0,
                    'tweet_count' => $user['public_metrics']['tweet_count'] ?? 0,
                ],
            ];
        } catch (\Throwable $e) {
            Log::error("[TwitterConnector] Fetch profile error: " . $e->getMessage());
            throw new RuntimeException("Could not fetch Twitter profile: " . $e->getMessage());
        }
    }

    public function introspectToken(string $token, ?string $providerId = null): array
    {
        try {
            $profile = $this->fetchAccountProfile($token, $providerId);
            return [
                'id' => (string) (($profile['provider_id'] ?? '') ?: $providerId),
                'name' => ($profile['name'] ?? '') ?: 'X (Twitter) Account',
                'avatar_url' => $profile['avatar_url'] ?? null,
                'account_type' => 'profile',
                'scopes' => ['tweet.read', 'tweet.write', 'users.read'],
                'expires_at' => Carbon::now()->addDays(60),
            ];
        } catch (\Throwable $e) {
            return [
                'id' => $providerId ?: 'tw_' . uniqid(),
                'name' => 'X (Twitter) Profile',
                'avatar_url' => null,
                'account_type' => 'profile',
                'scopes' => ['tweet.read', 'tweet.write', 'users.read'],
                'expires_at' => Carbon::now()->addDays(60),
            ];
        }
    }

    public function publish(array $content, array $tokens): array
    {
        $token = $tokens['access_token'] ?? null;
        if (!$token) {
            throw new RuntimeException("Missing Twitter / X access token.");
        }

        $caption = $content['caption'] ?? '';
        $idempotencyKey = $content['idempotency_key'] ?? null;

        try {
            $payload = [
                'text' => $caption,
            ];

            $request = Http::withToken($token);
            if ($idempotencyKey) {
                $request = $request->withHeaders(['X-Client-Transaction-Id' => $idempotencyKey]);
            }

            $response = $request->post("{$this->apiBaseUrl}/tweets", $payload);

            if (!$response->successful()) {
                throw new RuntimeException("Twitter API error [{$response->status()}]: " . $response->body());
            }

            $data = $response->json('data') ?? [];
            $tweetId = $data['id'] ?? null;

            return [
                'id' => $tweetId,
                'post_id' => $tweetId,
                'permalink' => $tweetId ? "https://x.com/i/status/{$tweetId}" : null,
                'raw_response' => $response->json(),
            ];
        } catch (\Throwable $e) {
            Log::error("[TwitterConnector] Publish tweet error: " . $e->getMessage());
            throw new RuntimeException("Failed to post tweet to X: " . $e->getMessage());
        }
    }
}

