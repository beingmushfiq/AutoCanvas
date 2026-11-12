<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRobotsIndexingHeaders
{
    /**
     * Handle an incoming request and enforce indexation boundary headers.
     *
     * In accordance with RFC 9309 and search engine security standards, private
     * tenant workspaces, administrative control planes, and internal API routes
     * MUST emit explicit 'X-Robots-Tag: noindex, nofollow, noarchive' headers to
     * guarantee that private data is never indexed, cached, or cited in snippets.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Define private route patterns requiring strict search engine isolation
        $privatePatterns = [
            'api/*',
            'workspace/*',
            'workspace',
            'master-control/*',
            'master-control',
            'oauth/*',
            'reset-password*',
        ];

        foreach ($privatePatterns as $pattern) {
            if ($request->is($pattern)) {
                $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
                break;
            }
        }

        return $response;
    }
}

