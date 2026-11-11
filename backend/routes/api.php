<?php

use App\Http\Controllers\Api\V1\HealthController;
use App\Modules\Analytics\Controllers\AnalyticsController;
use App\Modules\Auth\Controllers\AuthController;
use App\Modules\Automation\Controllers\AutopilotController;
use App\Modules\Billing\Controllers\BillingController;
use App\Modules\Billing\Controllers\CheckoutController;
use App\Modules\Billing\Controllers\PaymentSubmissionController;
use App\Modules\Brand\Controllers\BrandAssetController;
use App\Modules\Brand\Controllers\BrandController;
use App\Modules\Brand\Controllers\BrandDiscoveryController;
use App\Modules\Brand\Controllers\BrandMemoryController;
use App\Modules\Community\Controllers\InboxController;
use App\Modules\ContentProduction\Controllers\ContentItemController;
use App\Modules\ContentProduction\Controllers\ContentVariantController;
use App\Modules\ContentStrategy\Controllers\CampaignController;
use App\Modules\ContentStrategy\Controllers\ContentPillarController;
use App\Modules\ControlPlane\Controllers\AIOrchestrationController;
use App\Modules\ControlPlane\Controllers\CircuitBreakerController;
use App\Modules\ControlPlane\Controllers\MasterCmsController;
use App\Modules\ControlPlane\Controllers\MasterCommandController;
use App\Modules\ControlPlane\Controllers\PaymentVerificationController;
use App\Modules\ControlPlane\Controllers\PlatformMetricsController;
use App\Modules\ControlPlane\Controllers\SocialAppConfigController;
use App\Modules\ControlPlane\Controllers\SystemSettingsController;
use App\Modules\ControlPlane\Controllers\TenantManagementController;
use App\Modules\Creative\Controllers\CreativeStudioController;
use App\Modules\Knowledge\Controllers\KnowledgeController;
use App\Modules\Organization\Controllers\AuditLogController;
use App\Modules\Organization\Controllers\MemberController;
use App\Modules\Organization\Controllers\OrganizationController;
use App\Modules\Publishing\Controllers\PublishingController;
use App\Modules\Research\Controllers\CompetitorController;
use App\Modules\Research\Controllers\RssFeedController;
use App\Modules\Research\Controllers\TrendOpportunityController;
use App\Modules\SocialConnectors\Controllers\SocialConnectorController;
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

    // 3. Public Plans & CMS
    Route::get('/billing/plans', [BillingController::class, 'plans']);
    Route::get('/cms/public-data', [MasterCmsController::class, 'publicData']);

    // 4. Control Plane (Superadmin Sovereign Operations Engine)
    Route::prefix('control-plane')
        ->middleware(['auth:sanctum', 'platform.admin'])
        ->group(function () {
            // System Metrics & Telemetry
            Route::get('/metrics', [PlatformMetricsController::class, 'metrics'])
                ->middleware('permission:system.metrics.view');

            // Tenant Governance & Oversight
            Route::prefix('organizations')->middleware('permission:system.organizations.manage')->group(function () {
                Route::get('/', [TenantManagementController::class, 'index']);
                Route::get('/{id}', [TenantManagementController::class, 'show']);
                Route::put('/{id}/status', [TenantManagementController::class, 'updateStatus']);
                Route::post('/{id}/impersonate', [TenantManagementController::class, 'impersonate']);
            });

            // Global System Settings & Change Logs
            Route::prefix('settings')->group(function () {
                Route::get('/', [SystemSettingsController::class, 'index']);
                Route::put('/', [SystemSettingsController::class, 'update']);
                Route::get('/change-logs', [SystemSettingsController::class, 'changeLogs']);
            });

            // Emergency Circuit Breaker
            Route::prefix('circuit-breaker')->middleware('permission:system.emergency.circuit_breaker')->group(function () {
                Route::get('/', [CircuitBreakerController::class, 'status']);
                Route::post('/toggle', [CircuitBreakerController::class, 'toggle']);
            });

            // Offline & Local Payment Verification Queue (bKash / Nagad)
            Route::prefix('billing')->middleware('permission:system.billing.verify')->group(function () {
                Route::get('/verification-queue', [PaymentVerificationController::class, 'queue']);
                Route::post('/transactions/{id}/verify', [PaymentVerificationController::class, 'verify']);
            });

            // AI Provider & Model Routing Center
            Route::prefix('ai')->middleware('permission:system.ai.configure')->group(function () {
                Route::get('/providers', [AIOrchestrationController::class, 'providers']);
                Route::put('/routing', [AIOrchestrationController::class, 'updateRouting']);
                Route::get('/usage', [AIOrchestrationController::class, 'usage']);
            });

            // Global Social App Configuration & Accounts Telemetry
            Route::prefix('social')->group(function () {
                Route::get('/apps', [SocialAppConfigController::class, 'index']);
                Route::put('/apps', [SocialAppConfigController::class, 'update']);
                Route::get('/accounts', [SocialAppConfigController::class, 'accounts']);
            });

            // Natural-Language Master Command Interface
            Route::prefix('command')->group(function () {
                Route::post('/', [MasterCommandController::class, 'execute']);
                Route::post('/confirm', [MasterCommandController::class, 'confirm']);
            });

            // Sovereign Master CMS, Prompt Foundry & White-Label Theming
            Route::prefix('cms')->group(function () {
                Route::get('/blocks', [MasterCmsController::class, 'getBlocks']);
                Route::post('/blocks/{key}', [MasterCmsController::class, 'updateBlock']);
                Route::get('/theme', [MasterCmsController::class, 'getTheme']);
                Route::post('/theme', [MasterCmsController::class, 'updateTheme']);
                Route::get('/prompts', [MasterCmsController::class, 'getPrompts']);
                Route::post('/prompts/{taskType}', [MasterCmsController::class, 'savePrompt']);
                Route::post('/prompts/{taskType}/rollback', [MasterCmsController::class, 'rollbackPrompt']);
            });

            // Crawler & Novelty Engine Tuner
            Route::prefix('crawler-tuning')->group(function () {
                Route::get('/', [MasterCmsController::class, 'getCrawlerTuning']);
                Route::post('/', [MasterCmsController::class, 'updateCrawlerTuning']);
            });
        });

    // 5. Authenticated Routes (User-level)
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

            // Subscription, Invoices & Local Payments (bKash/Nagad)
            Route::prefix('billing')->group(function () {
                Route::get('/subscription', [BillingController::class, 'subscription']);
                Route::post('/checkout', [CheckoutController::class, 'checkout'])->middleware('permission:organization.billing.manage');
                Route::post('/payments/submit-trx', [PaymentSubmissionController::class, 'submit'])->middleware('permission:organization.billing.manage');
                Route::get('/invoices', [PaymentSubmissionController::class, 'invoices']);
                Route::get('/invoices/{id}', [PaymentSubmissionController::class, 'show']);
            });

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

                // Content Pillars (MOD-06)
                Route::get('/{id}/pillars', [ContentPillarController::class, 'index']);
                Route::get('/{id}/pillars/balance', [ContentPillarController::class, 'balance']);
                Route::post('/{id}/pillars', [ContentPillarController::class, 'store']);
                Route::put('/{id}/pillars/{pillarId}', [ContentPillarController::class, 'update']);
                Route::delete('/{id}/pillars/{pillarId}', [ContentPillarController::class, 'destroy']);

                // Campaigns (MOD-06)
                Route::get('/{id}/campaigns', [CampaignController::class, 'index']);
                Route::post('/{id}/campaigns', [CampaignController::class, 'store']);
                Route::put('/{id}/campaigns/{campaignId}', [CampaignController::class, 'update']);
                Route::delete('/{id}/campaigns/{campaignId}', [CampaignController::class, 'destroy']);

                // Creative Documents (MOD-08)
                Route::get('/{id}/creatives', [CreativeStudioController::class, 'index']);
                Route::post('/{id}/creatives', [CreativeStudioController::class, 'store']);

                // Content Items & AI Production (MOD-07)
                Route::get('/{id}/content', [ContentItemController::class, 'index']);
                Route::post('/{id}/content', [ContentItemController::class, 'store']);
                Route::get('/{id}/content/{contentId}', [ContentItemController::class, 'show']);
                Route::put('/{id}/content/{contentId}', [ContentItemController::class, 'update']);
                Route::delete('/{id}/content/{contentId}', [ContentItemController::class, 'destroy']);
                Route::post('/{id}/content/generate', [ContentItemController::class, 'generate']);
                Route::post('/{id}/content/{contentId}/qa-evaluate', [ContentItemController::class, 'evaluateQa']);
                Route::post('/{id}/content/{contentId}/submit-review', [ContentItemController::class, 'submitReview']);
                Route::post('/{id}/content/{contentId}/approve', [ContentItemController::class, 'approve']);
                Route::post('/{id}/content/{contentId}/reject', [ContentItemController::class, 'reject']);

                // RSS Feeds & Ingestion (MOD-04)
                Route::get('/{id}/feeds', [RssFeedController::class, 'index']);
                Route::post('/{id}/feeds', [RssFeedController::class, 'store']);
                Route::get('/{id}/articles', [RssFeedController::class, 'articles']);

                // Competitor Social Observation (MOD-05)
                Route::get('/{id}/competitors', [CompetitorController::class, 'index']);
                Route::post('/{id}/competitors', [CompetitorController::class, 'store']);
                Route::get('/{id}/competitor-insights', [CompetitorController::class, 'insights']);
                Route::get('/{id}/competitor-gaps', [CompetitorController::class, 'gaps']);

                // Trend Signals & Content Opportunities (MOD-05)
                Route::get('/{id}/opportunities', [TrendOpportunityController::class, 'index']);
                Route::post('/{id}/opportunities/detect', [TrendOpportunityController::class, 'detect']);
                Route::get('/{id}/trends', [TrendOpportunityController::class, 'trends']);

                // Community Unified Inbox (MOD-09 / Phase 9)
                Route::get('/{id}/inbox/conversations', [InboxController::class, 'conversations']);

                // Performance Analytics & Telemetry (Phase 10 / MOD-10)
                Route::get('/{id}/analytics/overview', [AnalyticsController::class, 'overview']);
                Route::get('/{id}/analytics/timeseries', [AnalyticsController::class, 'timeseries']);
                Route::get('/{id}/analytics/pillars', [AnalyticsController::class, 'pillars']);
                Route::get('/{id}/analytics/best-times', [AnalyticsController::class, 'bestTimes']);
                Route::get('/{id}/analytics/top-posts', [AnalyticsController::class, 'topPosts']);
                Route::post('/{id}/analytics/snapshots', [AnalyticsController::class, 'recordSnapshot']);
            });

            // Direct Research Actions (MOD-04 / MOD-05)
            Route::prefix('research')->group(function () {
                // Feeds & Articles
                Route::post('/feeds/{feedId}/sync', [RssFeedController::class, 'sync']);
                Route::delete('/feeds/{feedId}', [RssFeedController::class, 'destroy']);
                Route::post('/articles/{articleId}/toggle-save', [RssFeedController::class, 'toggleSaveArticle']);

                // Competitors
                Route::put('/competitors/{competitorId}', [CompetitorController::class, 'update']);
                Route::delete('/competitors/{competitorId}', [CompetitorController::class, 'destroy']);
                Route::get('/competitors/{competitorId}/posts', [CompetitorController::class, 'posts']);
                Route::post('/competitors/{competitorId}/posts', [CompetitorController::class, 'logPost']);

                // Opportunities
                Route::post('/opportunities/{opportunityId}/convert', [TrendOpportunityController::class, 'convert']);
                Route::post('/opportunities/{opportunityId}/dismiss', [TrendOpportunityController::class, 'dismiss']);
            });

            // Content Variants
            Route::put('/content/variants/{variantId}', [ContentVariantController::class, 'update']);

            // Creative Studio (MOD-08)
            Route::prefix('creative')->group(function () {
                Route::get('/templates', [CreativeStudioController::class, 'templates']);
                Route::post('/render', [CreativeStudioController::class, 'render']);
            });
            Route::post('/content/variants/{variantId}/render-creative', [CreativeStudioController::class, 'renderForVariant']);

            // Creative Canvas Documents
            Route::prefix('creatives')->group(function () {
                Route::get('/{id}', [CreativeStudioController::class, 'show']);
                Route::put('/{id}', [CreativeStudioController::class, 'update']);
                Route::post('/{id}/render', [CreativeStudioController::class, 'renderDocument']);
                Route::delete('/{id}', [CreativeStudioController::class, 'destroy']);
            });

            // Social Platform Connectors & OAuth (Phase 5)
            Route::prefix('social/connectors')->group(function () {
                Route::get('/', [SocialConnectorController::class, 'index']);
                Route::get('/{platform}/oauth-url', [SocialConnectorController::class, 'oauthUrl']);
                Route::post('/{platform}/callback', [SocialConnectorController::class, 'callback']);
                Route::post('/{accountId}/refresh', [SocialConnectorController::class, 'refresh']);
                Route::post('/{accountId}/test', [SocialConnectorController::class, 'testConnection']);
                Route::delete('/{accountId}', [SocialConnectorController::class, 'destroy']);
            });

            // Publishing Engine, Idempotency & Circuit Breaker (Phase 7)
            Route::post('/content/variants/{variantId}/publish-now', [PublishingController::class, 'publishNow']);
            Route::post('/content/variants/{variantId}/schedule', [PublishingController::class, 'schedule']);
            Route::prefix('publishing')->group(function () {
                Route::get('/dispatches', [PublishingController::class, 'index']);
                Route::get('/dispatches/{id}', [PublishingController::class, 'show']);
                Route::post('/dispatches/{id}/cancel', [PublishingController::class, 'cancel']);
                Route::get('/circuit-breaker/status', [PublishingController::class, 'circuitBreakerStatus']);
                Route::post('/circuit-breaker/pause', [PublishingController::class, 'pauseAutomations']);
                Route::post('/circuit-breaker/resume', [PublishingController::class, 'resumeAutomations']);
            });

            // Community Unified Inbox Actions (MOD-09 / Phase 9)
            Route::prefix('inbox')->group(function () {
                Route::get('/conversations/{id}', [InboxController::class, 'showConversation']);
                Route::post('/conversations/{id}/resolve', [InboxController::class, 'resolve']);
                Route::post('/conversations/{id}/escalate', [InboxController::class, 'escalate']);
                Route::post('/conversations/{id}/mark-spam', [InboxController::class, 'markSpam']);
                Route::post('/messages/{id}/reply', [InboxController::class, 'reply']);
                Route::post('/messages/{id}/generate-draft', [InboxController::class, 'generateDraft']);
                Route::post('/accounts/{accountId}/ingest', [InboxController::class, 'ingest']);
            });

            // Performance Analytics & Telemetry (MOD-10 / Phase 10)
            Route::post('/content/variants/{variantId}/analytics', [AnalyticsController::class, 'recordMetrics']);
            Route::get('/system/telemetry', [AnalyticsController::class, 'telemetry']);

            // Autonomous Intelligence & Cadence Engine (Autopilot Radar)
            Route::prefix('autopilot')->group(function () {
                Route::get('/cadence', [AutopilotController::class, 'getCadence']);
                Route::post('/cadence', [AutopilotController::class, 'updateCadence']);
                Route::get('/radar', [AutopilotController::class, 'radar']);
                Route::post('/trigger', [AutopilotController::class, 'trigger']);
                Route::get('/discovered-sources', [AutopilotController::class, 'discoveredSources']);
                Route::get('/fingerprints', [AutopilotController::class, 'fingerprints']);
            });
        });
    });
});

// Root API Health fallback
Route::get('/health', [HealthController::class, 'check']);
