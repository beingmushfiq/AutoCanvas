<?php

namespace App\Modules\ControlPlane\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MasterAssetUploadController extends Controller
{
    /**
     * Upload and sanitize platform branding assets (SVG, PNG, WebP, ICO).
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:svg,png,jpg,jpeg,webp,ico'], // max 10MB
            'asset_type' => ['nullable', 'string', 'in:primary_logo,dark_logo,favicon,general'],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $mime = $file->getMimeType();
        $safeName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $fileName = "{$safeName}-" . Str::random(8) . ".{$extension}";
        $storageDir = 'platform-assets';

        // Perform SVG sanitization to neutralize stored XSS vulnerabilities
        if ($extension === 'svg' || $mime === 'image/svg+xml') {
            $content = file_get_contents($file->getRealPath());

            // 1. Strip script tags
            $content = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $content);
            // 2. Strip inline event handlers (onload, onclick, onerror, etc.)
            $content = preg_replace('/\s*on[a-zA-Z]+\s*=\s*(["\']).*?\1/i', '', $content);
            $content = preg_replace('/\s*on[a-zA-Z]+\s*=\s*[^>\s]+/i', '', $content);
            // 3. Strip javascript: and data: text in href/src
            $content = preg_replace('/href\s*=\s*(["\'])\s*javascript:[^"\']*\1/i', 'href=""', $content);
            $content = preg_replace('/xlink:href\s*=\s*(["\'])\s*javascript:[^"\']*\1/i', 'xlink:href=""', $content);
            // 4. Strip dangerous foreignObject, embed, and object tags
            $content = preg_replace('/<(\/)?(foreignObject|embed|object|iframe|applet)\b[^>]*>/i', '', $content);

            $path = "{$storageDir}/{$fileName}";
            Storage::disk('public')->put($path, $content);
        } else {
            $path = $file->storeAs($storageDir, $fileName, 'public');
        }

        $url = Storage::disk('public')->url($path);

        // Record in system change log
        $admin = $request->user();
        if ($admin) {
            SystemChangeLog::create([
                'user_id' => $admin->id,
                'entity_type' => 'platform_asset',
                'entity_id' => $fileName,
                'action' => 'platform_asset.uploaded',
                'old_values' => null,
                'new_values' => [
                    'filename' => $fileName,
                    'url' => $url,
                    'mime' => $mime,
                    'size' => $file->getSize(),
                    'asset_type' => $request->input('asset_type'),
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'url' => $url,
                'path' => $path,
                'filename' => $fileName,
                'mime' => $mime,
                'size' => $file->getSize(),
            ],
            'message' => 'Asset uploaded and validated successfully.',
        ], 201);
    }
}

