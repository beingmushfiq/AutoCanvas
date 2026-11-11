<?php

namespace App\Providers;

use App\Core\Security\PermissionRegistry;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PermissionRegistry::class, function () {
            return new PermissionRegistry();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Dynamic Gate resolution for RBAC permissions
        Gate::before(function (User $user, string $ability) {
            // Check if user has permission in active or user context
            return $user->hasPermission($ability);
        });
    }
}
