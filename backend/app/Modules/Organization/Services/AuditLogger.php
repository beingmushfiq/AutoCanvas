<?php

namespace App\Modules\Organization\Services;

use App\Modules\Organization\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditLogger
{
    /**
     * Record an audit log event.
     */
    public static function log(
        string $action,
        ?Model $auditable = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $organizationId = null,
        ?string $workspaceId = null
    ): AuditLog {
        $orgId = $organizationId ?? (app()->has('current_organization_id') ? app('current_organization_id') : null);
        $wsId = $workspaceId ?? (app()->has('current_workspace_id') ? app('current_workspace_id') : null);
        $userId = auth()->check() ? auth()->id() : null;

        return AuditLog::create([
            'organization_id' => $orgId,
            'workspace_id' => $wsId,
            'user_id' => $userId,
            'action' => $action,
            'auditable_type' => $auditable ? get_class($auditable) : null,
            'auditable_id' => $auditable?->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }
}
