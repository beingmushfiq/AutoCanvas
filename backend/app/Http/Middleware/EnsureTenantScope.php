<?php

namespace App\Http\Middleware;

use App\Modules\Workspace\Models\Workspace;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantScope
{
    /**
     * Handle an incoming request and bind tenant scope into the container.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHENTICATED',
                    'message' => 'Authentication required.',
                ],
            ], 401);
        }

        // 1. Resolve requested workspace ID from header or user's active preference
        $workspaceId = $request->header('X-Workspace-Id') ?? $user->current_workspace_id;

        $workspace = null;

        if ($workspaceId) {
            $workspace = Workspace::withoutGlobalScopes()
                ->where('id', $workspaceId)
                ->first();
        }

        // Fallback: If no workspace ID supplied or found, pick user's first available workspace
        if (! $workspace) {
            $workspace = $user->workspaces()->first();
        }

        // Platform Admin Fallback: If user is platform admin and has no workspace assigned, bind to first active workspace
        if (! $workspace && $user->is_platform_admin) {
            $workspace = Workspace::withoutGlobalScopes()->where('is_default', true)->first()
                ?? Workspace::withoutGlobalScopes()->first();
        }

        if (! $workspace) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NO_WORKSPACE_FOUND',
                    'message' => 'No active workspace found. Please complete onboarding.',
                ],
            ], 403);
        }

        // 2. Verify the authenticated user is an authorized member of the organization
        if (! $user->isMemberOfOrganization($workspace->organization_id) && ! $user->is_platform_admin) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'TENANT_ACCESS_DENIED',
                    'message' => 'You do not have access to this organization or workspace.',
                ],
            ], 403);
        }

        // 3. Bind tenant context into application service container
        app()->instance('current_organization_id', $workspace->organization_id);
        app()->instance('current_workspace_id', $workspace->id);

        $request->attributes->set('current_organization_id', $workspace->organization_id);
        $request->attributes->set('current_workspace_id', $workspace->id);
        $request->attributes->set('workspace', $workspace);

        return $next($request);
    }
}
