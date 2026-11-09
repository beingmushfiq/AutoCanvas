<?php

namespace App\Modules\Workspace\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Billing\Services\EntitlementService;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Services\AuditLogger;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WorkspaceController extends Controller
{
    public function __construct(
        protected EntitlementService $entitlementService
    ) {}

    /**
     * List all workspaces belonging to the active organization.
     */
    public function index(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');
        $organization = Organization::findOrFail($orgId);

        $workspaces = $organization->workspaces()->get();

        return response()->json([
            'success' => true,
            'data' => $workspaces->map(fn ($ws) => [
                'id' => $ws->id,
                'name' => $ws->name,
                'slug' => $ws->slug,
                'is_default' => $ws->is_default,
                'created_at' => $ws->created_at->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Create a new workspace in the active organization.
     */
    public function store(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');
        $organization = Organization::findOrFail($orgId);
        $userRole = $organization->getRoleOf($request->user());

        if (! in_array($userRole, ['owner', 'admin'], true) && ! $request->user()->is_platform_admin) {
            abort(403, 'Only owners and administrators can create new workspaces.');
        }

        // Check subscription workspace limit!
        $this->entitlementService->assertCanCreateWorkspace($organization);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while ($organization->workspaces()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $workspace = Workspace::create([
            'organization_id' => $organization->id,
            'name' => $validated['name'],
            'slug' => $slug,
            'is_default' => false,
        ]);

        // Add creator as workspace owner
        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $request->user()->id,
            'role' => 'owner',
        ]);

        AuditLogger::log('workspace.created', $workspace, null, ['name' => $workspace->name], $organization->id, $workspace->id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
                'is_default' => $workspace->is_default,
            ],
            'message' => 'Workspace created successfully.',
        ], 201);
    }

    /**
     * Show details of a specific workspace.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $workspace = Workspace::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
                'is_default' => $workspace->is_default,
                'organization_id' => $workspace->organization_id,
                'created_at' => $workspace->created_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Update workspace name.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $workspace = Workspace::findOrFail($id);
        $organization = $workspace->organization;
        $userRole = $organization->getRoleOf($request->user());

        if (! in_array($userRole, ['owner', 'admin'], true) && ! $request->user()->is_platform_admin) {
            abort(403, 'Only owners and administrators can update workspace details.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $oldName = $workspace->name;
        $workspace->update(['name' => $validated['name']]);

        AuditLogger::log('workspace.updated', $workspace, ['name' => $oldName], ['name' => $workspace->name], $organization->id, $workspace->id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
            ],
            'message' => 'Workspace updated successfully.',
        ]);
    }

    /**
     * Delete a workspace.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $workspace = Workspace::findOrFail($id);
        $organization = $workspace->organization;
        $userRole = $organization->getRoleOf($request->user());

        if (! in_array($userRole, ['owner', 'admin'], true) && ! $request->user()->is_platform_admin) {
            abort(403, 'Only owners and administrators can delete workspaces.');
        }

        if ($workspace->is_default) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'CANNOT_DELETE_DEFAULT_WORKSPACE',
                    'message' => 'The default workspace cannot be deleted.',
                ],
            ], 422);
        }

        AuditLogger::log('workspace.deleted', $workspace, ['name' => $workspace->name], null, $organization->id, $workspace->id);

        $workspace->delete();

        return response()->json([
            'success' => true,
            'message' => 'Workspace deleted successfully.',
        ]);
    }
}
