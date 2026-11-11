<?php

namespace App\Core\Security;

use Illuminate\Validation\ValidationException;

class UrlSafetyValidator
{
    /**
     * Strict SSRF validator preventing access to internal, loopback, or cloud metadata IPs.
     *
     * @throws ValidationException
     */
    public static function assertSafeUrl(string $url): void
    {
        $parts = parse_url($url);
        if (! isset($parts['scheme']) || ! in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
            throw ValidationException::withMessages([
                'url' => ['Only HTTP and HTTPS URLs are permitted.'],
            ]);
        }

        $host = $parts['host'] ?? '';
        if (empty($host)) {
            throw ValidationException::withMessages([
                'url' => ['Invalid URL host provided.'],
            ]);
        }

        $lowerHost = strtolower($host);

        // Reject obvious loopback and metadata hostnames
        if (in_array($lowerHost, ['localhost', '127.0.0.1', '::1', '0.0.0.0', 'instance-data', 'metadata.google.internal'], true)) {
            throw ValidationException::withMessages([
                'url' => ['SSRF Security Violation: Access to loopback or metadata hosts is strictly prohibited.'],
            ]);
        }

        $ip = gethostbyname($host);
        if (! filter_var($ip, FILTER_VALIDATE_IP)) {
            throw ValidationException::withMessages([
                'url' => ['Unable to resolve hostname IP address.'],
            ]);
        }

        // Direct check for AWS/GCP/Azure link-local metadata IP
        if (str_starts_with($ip, '169.254.')) {
            throw ValidationException::withMessages([
                'url' => ['SSRF Security Violation: Access to cloud metadata services is blocked.'],
            ]);
        }

        // Validate IP is NOT private, reserved, or loopback
        $isPublic = filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );

        if (! $isPublic || str_starts_with($ip, '127.')) {
            throw ValidationException::withMessages([
                'url' => ['SSRF Security Violation: Target IP address belongs to a private or restricted network.'],
            ]);
        }
    }
}

