<?php

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Billing\Services\EntitlementService;
use App\Modules\Organization\Models\Invitation;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Organization\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MemberController extends Controller
{
    public function __construct(
        protected EntitlementService $entitlementService
    ) {}

    /**
     * List all members of the active organization.
     */
    public function index(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');
        $organization = Organization::findOrFail($orgId);

        $members = $organization->members()->with('user')->get();
        $invitations = $organization->invitations()->whereNull('accepted_at')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'members' => $members->map(fn ($m) => [
                    'id' => $m->id,
                    'user_id' => $m->user_id,
                    'name' => $m->user?->name,
                    'email' => $m->user?->email,
                    'role' => $m->role,
                    'joined_at' => $m->created_at->toIso8601String(),
                ]),
                'invitations' => $invitations->map(fn ($inv) => [
                    'id' => $inv->id,
                    'email' => $inv->email,
                    'role' => $inv->role,
                    'expires_at' => $inv->expires_at->toIso8601String(),
                ]),
            ],
        ]);
    }

    /**
     * Invite a new team member.
     */
    public function invite(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');
        $organization = Organization::findOrFail($orgId);
        $userRole = $organization->getRoleOf($request->user());

        if (! in_array($userRole, ['owner', 'admin'], true) && ! $request->user()->is_platform_admin) {
            abort(403, 'Only owners and administrators can invite new members.');
        }

        // 1. Check plan limit
        $this->entitlementService->assertCanAddMember($organization);

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'role' => ['required', 'string', 'in:admin,manager,editor,designer,publisher,analyst,community_manager,viewer'],
        ]);

        $email = strtolower(trim($validated['email']));

        // Check if already an existing member
        $existingUser = User::where('email', $email)->first();
        if ($existingUser && $organization->members()->where('user_id', $existingUser->id)->exists()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'ALREADY_MEMBER',
                    'message' => 'This user is already a member of this organization.',
                ],
            ], 422);
        }

        $invitation = Invitation::create([
            'organization_id' => $organization->id,
            'workspace_id' => app('current_workspace_id'),
            'email' => $email,
            'role' => $validated['role'],
            'token' => Str::random(48),
            'expires_at' => now()->addDays(7),
        ]);

        AuditLogger::log('member.invited', $invitation, null, ['email' => $email, 'role' => $validated['role']], $organization->id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $invitation->id,
                'email' => $invitation->email,
                'role' => $invitation->role,
                'expires_at' => $invitation->expires_at->toIso8601String(),
            ],
            'message' => "Invitation successfully sent to {$email}.",
        ], 201);
    }

    /**
     * Update an existing member's role.
     */
    public function updateRole(Request $request, string $memberId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $organization = Organization::findOrFail($orgId);
        $userRole = $organization->getRoleOf($request->user());

        if (! in_array($userRole, ['owner', 'admin'], true) && ! $request->user()->is_platform_admin) {
            abort(403, 'Only owners and administrators can update member roles.');
        }

        $member = OrganizationMember::where('organization_id', $organization->id)->findOrFail($memberId);

        // Cannot change role of the owner unless caller is owner
        if ($member->role === 'owner' && $userRole !== 'owner') {
            abort(403, 'You cannot modify the organization owner role.');
        }

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:owner,admin,manager,editor,designer,publisher,analyst,community_manager,viewer'],
        ]);

        $oldRole = $member->role;
        $member->update(['role' => $validated['role']]);

        AuditLogger::log('member.role_updated', $member, ['role' => $oldRole], ['role' => $validated['role']], $organization->id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $member->id,
                'role' => $member->role,
            ],
            'message' => 'Role updated successfully.',
        ]);
    }

    /**
     * Remove a member from the organization.
     */
    public function remove(Request $request, string $memberId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $organization = Organization::findOrFail($orgId);
        $userRole = $organization->getRoleOf($request->user());

        if (! in_array($userRole, ['owner', 'admin'], true) && ! $request->user()->is_platform_admin) {
            abort(403, 'Only owners and administrators can remove members.');
        }

        $member = OrganizationMember::where('organization_id', $organization->id)->findOrFail($memberId);

        if ($member->role === 'owner') {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'CANNOT_REMOVE_OWNER',
                    'message' => 'The organization owner cannot be removed. Transfer ownership first.',
                ],
            ], 422);
        }

        AuditLogger::log('member.removed', $member, ['user_id' => $member->user_id, 'role' => $member->role], null, $organization->id);

        $member->delete();

        return response()->json([
            'success' => true,
            'message' => 'Member removed successfully.',
        ]);
    }
}
