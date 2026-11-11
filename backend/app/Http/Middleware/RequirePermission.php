<?php

namespace App\Http\Middleware;

use App\Core\Security\PermissionRegistry;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePermission
{
    public function __construct(
        protected PermissionRegistry $permissionRegistry
    ) {}

    /**
     * Handle an incoming request and assert required RBAC permission.
     */
    public function handle(Request $request, Closure $next, string $permission): Response
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

        $orgId = app()->has('current_organization_id')
            ? app('current_organization_id')
            : $user->current_organization_id;

        if (! $this->permissionRegistry->hasPermission($user, $permission, $orgId)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'PERMISSION_DENIED',
                    'message' => "You do not have the required permission: {$permission}",
                ],
            ], 403);
        }

        return $next($request);
    }
}

