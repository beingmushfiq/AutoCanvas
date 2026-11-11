<?php

namespace App\Modules\ControlPlane\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Services\TenantGovernanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantManagementController extends Controller
{
    public function __construct(
        protected TenantGovernanceService $governanceService
    ) {}

    /**
     * List all organizations with search, plan, and status filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'status', 'plan_id']);
        $perPage = (int) $request->get('per_page', 20);

        $paginator = $this->governanceService->listOrganizations($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'meta' => [
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Inspect single organization.
     */
    public function show(string $id): JsonResponse
    {
        $org = $this->governanceService->getOrganization($id);

        return response()->json([
            'success' => true,
            'data' => $org,
        ]);
    }

    /**
     * Register a new tenant organization.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'billing_email' => ['nullable', 'email', 'max:255'],
            'timezone' => ['nullable', 'string', 'max:100'],
            'plan_id' => ['nullable', 'string', 'exists:plans,id'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'email', 'max:255'],
            'owner_password' => ['nullable', 'string', 'min:8'],
            'send_invite' => ['nullable', 'boolean'],
        ]);

        $admin = $request->user();
        $result = $this->governanceService->registerTenant($validated, $admin);

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => "Tenant organization '{$result['organization']->name}' registered successfully.",
        ], 201);
    }

    /**
     * Update tenant metadata or subscription tier.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'billing_email' => ['nullable', 'email', 'max:255'],
            'timezone' => ['nullable', 'string', 'max:100'],
            'plan_id' => ['nullable', 'string', 'exists:plans,id'],
        ]);

        $admin = $request->user();
        $org = $this->governanceService->updateTenant($id, $validated, $admin);

        return response()->json([
            'success' => true,
            'data' => $org,
            'message' => "Tenant organization '{$org->name}' updated successfully.",
        ]);
    }

    /**
     * Delete / offboard an organization.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $admin = $request->user();
        $this->governanceService->deleteTenant($id, $admin);

        return response()->json([
            'success' => true,
            'message' => 'Tenant organization offboarded and soft-deleted successfully.',
        ]);
    }

    /**
     * Update organization status (suspend / activate).
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,suspended'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $admin = $request->user();

        if ($validated['status'] === 'suspended') {
            $org = $this->governanceService->suspendOrganization($id, $admin, $validated['reason'] ?? null);
            $message = "Organization {$org->name} suspended successfully.";
        } else {
            $org = $this->governanceService->activateOrganization($id, $admin);
            $message = "Organization {$org->name} activated successfully.";
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $org->id,
                'name' => $org->name,
                'status' => $org->status,
            ],
            'message' => $message,
        ]);
    }

    /**
     * Issue scoped read-only impersonation token.
     */
    public function impersonate(Request $request, string $id): JsonResponse
    {
        $admin = $request->user();
        $result = $this->governanceService->issueImpersonationToken($id, $admin);

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Scoped impersonation session generated (valid 15 minutes).',
        ]);
    }

    /**
     * List all subscription plans available for tenant assignment.
     */
    public function plans(): JsonResponse
    {
        $plans = $this->governanceService->listPlans();

        return response()->json([
            'success' => true,
            'data' => $plans,
        ]);
    }

    /**
     * List workspaces belonging to an organization.
     */
    public function workspaces(string $id): JsonResponse
    {
        $workspaces = $this->governanceService->listWorkspaces($id);

        return response()->json([
            'success' => true,
            'data' => $workspaces,
        ]);
    }

    /**
     * Provision an additional workspace for an organization.
     */
    public function createWorkspace(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
        ]);

        $admin = $request->user();
        $workspace = $this->governanceService->createWorkspace($id, $validated, $admin);

        return response()->json([
            'success' => true,
            'data' => $workspace,
            'message' => "Workspace '{$workspace->name}' created successfully.",
        ], 201);
    }
}
