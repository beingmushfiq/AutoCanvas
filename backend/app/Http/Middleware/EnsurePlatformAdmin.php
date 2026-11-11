<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformAdmin
{
    /**
     * Handle an incoming request and assert platform administrator privileges.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'UNAUTHENTICATED',
                    'message' => 'Authentication required.',
                ],
            ], 401);
        }

        if (! $user->is_platform_admin) {
            return response()->json([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'ACCESS_DENIED',
                    'message' => 'Platform administrator access required.',
                ],
            ], 403);
        }

        return $next($request);
    }
}

