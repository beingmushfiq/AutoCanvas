<?php

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Organization\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * List paginated audit logs for the active organization.
     */
    public function index(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');

        $logs = AuditLog::with('user:id,name,email')
            ->where('organization_id', $orgId)
            ->orderByDesc('created_at')
            ->paginate(25);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
