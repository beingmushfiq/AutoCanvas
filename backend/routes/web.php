<?php

use Illuminate\Support\Facades\Route;

// 1. Root & SPA Fallback: Serve React SPA index.html when deployed to production
Route::get('/', function () {
    $spaIndex = public_path('index.html');
    if (file_exists($spaIndex)) {
        return response()->file($spaIndex);
    }
    return view('welcome');
});

Route::fallback(function () {
    $spaIndex = public_path('index.html');
    if (file_exists($spaIndex)) {
        return response()->file($spaIndex);
    }
    return response()->json(['error' => 'Not Found'], 404);
});
