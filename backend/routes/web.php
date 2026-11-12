<?php

use App\Http\Controllers\Api\V1\SeoController;
use Illuminate\Support\Facades\Route;

// 1. Dynamic Search Engine Discovery & Robots Routes
Route::get('/robots.txt', [SeoController::class, 'robots']);
Route::get('/sitemap.xml', [SeoController::class, 'sitemap']);

// 2. Public Landing Page with Hybrid Pre-Injected Meta & Schema.org JSON-LD
Route::get('/', [SeoController::class, 'landingPage']);

// 3. SPA Client-Side Fallback for Non-API Routes
Route::fallback(function () {
    $spaIndex = public_path('index.html');
    if (file_exists($spaIndex)) {
        return response()->file($spaIndex);
    }

    return response()->json(['error' => 'Not Found'], 404);
});
