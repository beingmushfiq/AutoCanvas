<?php

namespace App\Modules\ControlPlane\Controllers;

use App\Core\Security\SvgSanitizer;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use Illuminate\Contracts\Filesystem\Cloud;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
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

        /** @var UploadedFile|null $file */
        $file = $request->file('file');
        if (! $file instanceof UploadedFile) {
            return response()->json([
                'success' => false,
                'error' => ['message' => 'No valid file uploaded.'],
            ], 422);
        }

        $extension = strtolower($file->getClientOriginalExtension());
        $mime = $file->getMimeType() ?: 'application/octet-stream';
        $safeName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $fileName = "{$safeName}-" . Str::random(8) . ".{$extension}";
        $storageDir = 'platform-assets';

        /** @var Cloud $publicDisk */
        $publicDisk = Storage::disk('public');

        // Perform SVG sanitization to neutralize stored XSS vulnerabilities
        if ($extension === 'svg' || $mime === 'image/svg+xml') {
            $realPath = $file->getRealPath();
            $content = $realPath ? file_get_contents($realPath) : '';
            $sanitized = SvgSanitizer::sanitize($content ?: '');

            $path = "{$storageDir}/{$fileName}";
            $publicDisk->put($path, $sanitized);
        } else {
            $path = $file->storeAs($storageDir, $fileName, 'public');
        }

        $url = $publicDisk->url($path);

        // Record in system change log
        /** @var User|null $admin */
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

