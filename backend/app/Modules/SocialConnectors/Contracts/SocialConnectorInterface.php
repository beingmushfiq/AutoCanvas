<?php

namespace App\Modules\SocialConnectors\Contracts;

interface SocialConnectorInterface
{
    /**
     * Get platform identifier ('facebook', 'instagram', 'linkedin', etc.)
     */
    public function getPlatform(): string;

    /**
     * Generate official OAuth2 authorization URL with signed state.
     */
    public function getAuthorizationUrl(string $state, array $options = []): string;

    /**
     * Exchange OAuth2 authorization code for access and refresh tokens.
     */
    public function exchangeCodeForTokens(string $code, string $redirectUri): array;

    /**
     * Refresh an expired or expiring access token using a refresh token.
     */
    public function refreshToken(string $refreshToken): array;

    /**
     * Validate an access token with the remote platform API.
     */
    public function validateToken(string $accessToken): bool;

    /**
     * Fetch connected profile or organization details.
     */
    public function fetchAccountProfile(string $accessToken, ?string $accountId = null): array;

    /**
     * Introspect an access token against the upstream platform API.
     */
    public function introspectToken(string $token, ?string $providerId = null): array;

    /**
     * Publish content (text commentary, image/video URLs, carousel) to destination account.
     */
    public function publish(array $content, array $tokens): array;
}
