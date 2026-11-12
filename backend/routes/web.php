<?php

use App\Http\Controllers\Api\V1\SeoController;
use Illuminate\Support\Facades\Route;

// 1. Dynamic Search Engine & LLM Agent Discovery Routes
Route::get('/robots.txt', [SeoController::class, 'robots']);
Route::get('/sitemap.xml', [SeoController::class, 'sitemap']);
Route::get('/llms.txt', [SeoController::class, 'llms']);
Route::get('/llms-full.txt', [SeoController::class, 'llmsFull']);
Route::get('/humans.txt', [SeoController::class, 'humans']);
Route::get('/.well-known/security.txt', [SeoController::class, 'securityTxt']);

// 2. Canonical Public Marketing Routes with Server-Side Pre-Injection
Route::get('/', [SeoController::class, 'landingPage']);
Route::get('/pricing', [SeoController::class, 'landingPage']);
Route::get('/features/creative-studio', [SeoController::class, 'landingPage']);
Route::get('/features/publishing-calendar', [SeoController::class, 'landingPage']);
Route::get('/solutions/agencies', [SeoController::class, 'landingPage']);
Route::get('/docs', [SeoController::class, 'landingPage']);
Route::get('/terms', [SeoController::class, 'landingPage']);
Route::get('/privacy', [SeoController::class, 'landingPage']);

// 3. Social Platform Callback Route (Publicly Accessible)
Route::get('/oauth/social/{platform}/callback', [App\Modules\SocialConnectors\Controllers\SocialConnectorController::class, 'handleBrowserCallback']);

// 4. SPA Client-Side Fallback for Non-API Routes
Route::fallback(function () {
    $spaIndex = public_path('index.html');
    if (file_exists($spaIndex)) {
        return response()->file($spaIndex);
    }

    return response()->json(['error' => 'Not Found'], 404);
});
