<?php

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /**
     * List all organizations the authenticated user belongs to.
     */
    public function index(Request $request): JsonResponse
    {
        $organizations = $request->user()->organizations()->with('subscription.plan')->get();

        return response()->json([
            'success' => true,
            'data' => $organizations->map(fn ($org) => [
                'id' => $org->id,
                'name' => $org->name,
                'slug' => $org->slug,
                'timezone' => $org->timezone,
                'role' => $org->pivot->role,
                'plan' => $org->subscription?->plan?->name ?? 'Starter',
                'created_at' => $org->created_at->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Show details of a specific organization.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $org = Organization::with(['workspaces', 'subscription.plan'])->findOrFail($id);

        if (! $request->user()->isMemberOfOrganization($org->id) && ! $request->user()->is_platform_admin) {
            abort(403, 'You do not have permission to view this organization.');
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $org->id,
                'name' => $org->name,
                'slug' => $org->slug,
                'timezone' => $org->timezone,
                'billing_email' => $org->billing_email,
                'role' => $org->getRoleOf($request->user()),
                'plan' => $org->subscription?->plan?->name ?? 'Starter',
                'workspaces_count' => $org->workspaces()->count(),
                'members_count' => $org->members()->count(),
                'created_at' => $org->created_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Update organization settings.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $org = Organization::findOrFail($id);
        $role = $org->getRoleOf($request->user());

        if (! in_array($role, ['owner', 'admin'], true) && ! $request->user()->is_platform_admin) {
            abort(403, 'Only owners and administrators can update organization settings.');
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'timezone' => ['sometimes', 'string', 'max:100'],
            'billing_email' => ['sometimes', 'email', 'max:255'],
        ]);

        $oldValues = $org->only(array_keys($validated));
        $org->update($validated);

        AuditLogger::log('organization.updated', $org, $oldValues, $validated, $org->id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $org->id,
                'name' => $org->name,
                'slug' => $org->slug,
                'timezone' => $org->timezone,
                'billing_email' => $org->billing_email,
            ],
            'message' => 'Organization updated successfully.',
        ]);
    }
}
