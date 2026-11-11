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
     * List all organizations with search and status filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'status']);
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
}

