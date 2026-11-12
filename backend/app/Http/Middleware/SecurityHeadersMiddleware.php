<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request and attach enterprise HTTP security headers.
     *
     * Enforces OWASP ASVS v4.0.3 and defense-in-depth HTTP response protection against
     * clickjacking, MIME sniffing, protocol downgrades, and browser feature abuse.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // 1. Prevent Clickjacking
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // 2. Prevent MIME Sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // 3. Legacy XSS filter for older user agents
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // 4. Protect Referrer Information
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // 5. Restrict unused browser device capabilities
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // 6. Enforce Strict-Transport-Security when accessed via TLS/HTTPS
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}

