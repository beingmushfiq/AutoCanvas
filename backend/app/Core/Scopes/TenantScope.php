<?php

namespace App\Core\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * Whether to enforce the scope even in console/CLI testing contexts.
     */
    public bool $enforceInConsole = false;

    /**
     * Apply the tenant scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // If running in console (e.g. queue worker or migration), only apply if tenant explicitly bound or enforced
        if (! $this->enforceInConsole && app()->runningInConsole() && ! app()->has('current_organization_id')) {
            return;
        }

        $organizationId = null;

        if (app()->has('current_organization_id')) {
            $organizationId = app('current_organization_id');
        } elseif (auth()->check() && isset(auth()->user()->current_organization_id)) {
            $organizationId = auth()->user()->current_organization_id;
        }

        if ($organizationId) {
            $builder->where($model->qualifyColumn('organization_id'), '=', $organizationId);
        } else {
            // Defense-in-depth: Fail closed to prevent cross-tenant data leakage on unscoped queries
            $builder->whereRaw('1 = 0');
        }
    }
}
