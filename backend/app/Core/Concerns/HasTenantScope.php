<?php

namespace App\Core\Concerns;

use App\Core\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;

trait HasTenantScope
{
    /**
     * Boot the tenant scope for the model.
     */
    protected static function bootHasTenantScope(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (Model $model) {
            if (empty($model->organization_id)) {
                if (app()->has('current_organization_id')) {
                    $model->organization_id = app('current_organization_id');
                } elseif (auth()->check() && isset(auth()->user()->current_organization_id)) {
                    $model->organization_id = auth()->user()->current_organization_id;
                }
            }
        });
    }
}
