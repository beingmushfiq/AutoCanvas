<?php

use App\Http\Controllers\Api\V1\HealthController;
use App\Modules\Auth\Controllers\AuthController;
use App\Modules\Billing\Controllers\BillingController;
use App\Modules\Brand\Controllers\BrandAssetController;
use App\Modules\Brand\Controllers\BrandController;
use App\Modules\Brand\Controllers\BrandDiscoveryController;
use App\Modules\Brand\Controllers\BrandMemoryController;
use App\Modules\Knowledge\Controllers\KnowledgeController;
use App\Modules\Organization\Controllers\AuditLogController;
use App\Modules\Organization\Controllers\MemberController;
use App\Modules\Organization\Controllers\OrganizationController;
use App\Modules\Workspace\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Version 1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // 1. System Health
    Route::get('/health', [HealthController::class, 'check']);

    // 2. Public / Guest Auth
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
    });

    // 3. Public Plans
    Route::get('/billing/plans', [BillingController::class, 'plans']);

    // 4. Authenticated Routes (User-level)
    Route::middleware('auth:sanctum')->group(function () {
        Route::prefix('auth')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/switch-workspace', [AuthController::class, 'switchWorkspace']);
        });

        Route::prefix('organizations')->group(function () {
            Route::get('/', [OrganizationController::class, 'index']);
            Route::get('/{id}', [OrganizationController::class, 'show']);
            Route::put('/{id}', [OrganizationController::class, 'update']);
        });

        // 5. Tenant-Scoped Routes (Requires active organization/workspace context)
        Route::middleware('tenant')->group(function () {
            // Workspaces
            Route::prefix('workspaces')->group(function () {
                Route::get('/', [WorkspaceController::class, 'index']);
                Route::post('/', [WorkspaceController::class, 'store']);
                Route::get('/{id}', [WorkspaceController::class, 'show']);
                Route::put('/{id}', [WorkspaceController::class, 'update']);
                Route::delete('/{id}', [WorkspaceController::class, 'destroy']);
            });

            // Organization Members
            Route::prefix('organization/members')->group(function () {
                Route::get('/', [MemberController::class, 'index']);
                Route::post('/invite', [MemberController::class, 'invite']);
                Route::put('/{memberId}', [MemberController::class, 'updateRole']);
                Route::delete('/{memberId}', [MemberController::class, 'remove']);
            });

            // Subscription & Entitlements
            Route::get('/billing/subscription', [BillingController::class, 'subscription']);

            // Audit Logs
            Route::get('/audit-logs', [AuditLogController::class, 'index']);

            // Brands & Brand Intelligence
            Route::prefix('brands')->group(function () {
                Route::get('/', [BrandController::class, 'index']);
                Route::post('/', [BrandController::class, 'store']);
                Route::get('/{id}', [BrandController::class, 'show']);
                Route::delete('/{id}', [BrandController::class, 'destroy']);

                // Brand Sub-profiles
                Route::put('/{id}/profile', [BrandController::class, 'updateProfile']);
                Route::put('/{id}/visual', [BrandController::class, 'updateVisual']);
                Route::put('/{id}/voice', [BrandController::class, 'updateVoice']);

                // Brand Assets
                Route::get('/{id}/assets', [BrandAssetController::class, 'index']);
                Route::post('/{id}/assets', [BrandAssetController::class, 'store']);
                Route::delete('/{id}/assets/{assetId}', [BrandAssetController::class, 'destroy']);

                // Knowledge Ingestion & Scoped Retrieval
                Route::get('/{id}/knowledge', [KnowledgeController::class, 'index']);
                Route::post('/{id}/knowledge/upload', [KnowledgeController::class, 'upload']);
                Route::post('/{id}/knowledge/url', [KnowledgeController::class, 'submitUrl']);
                Route::post('/{id}/knowledge/search', [KnowledgeController::class, 'search']);

                // AI Brand Discovery
                Route::post('/{id}/discovery', [BrandDiscoveryController::class, 'discover']);

                // Brand Memory (Approved Facts & Insights)
                Route::get('/{id}/memory', [BrandMemoryController::class, 'index']);
                Route::post('/{id}/memory', [BrandMemoryController::class, 'store']);
                Route::delete('/{id}/memory/{memoryId}', [BrandMemoryController::class, 'destroy']);
            });
        });
    });
});

// Root API Health fallback
Route::get('/health', [HealthController::class, 'check']);
