<?php

namespace App\Modules\Brand\Controllers;

use App\Core\Security\SvgSanitizer;
use App\Http\Controllers\Controller;
use App\Modules\Brand\Models\Brand;
use App\Modules\Brand\Models\BrandAsset;
use App\Modules\Organization\Services\AuditLogger;
use Illuminate\Contracts\Filesystem\Cloud;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BrandAssetController extends Controller
{
    /**
     * List brand assets.
     */
    public function index(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $query = $brand->assets();

        if ($request->has('type')) {
            $query->where('type', $request->query('type'));
        }

        $assets = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $assets,
        ]);
    }

    /**
     * Upload / store a brand asset.
     */
    public function store(Request $request, string $brandId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $wsId = app('current_workspace_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);

        $request->validate([
            'file' => ['required', 'file', 'max:20480', 'mimes:png,jpg,jpeg,webp,svg,pdf,ttf,otf,woff,woff2'], // max 20MB
            'type' => ['required', 'string', 'in:logo,guideline,palette,font,template,other'],
            'name' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array'],
        ]);

        /** @var UploadedFile|null $file */
        $file = $request->file('file');
        if (! $file instanceof UploadedFile) {
            return response()->json([
                'success' => false,
                'error' => ['message' => 'No valid file uploaded.'],
            ], 422);
        }

        $name = $request->input('name', $file->getClientOriginalName());
        $extension = strtolower($file->getClientOriginalExtension());
        $mime = $file->getMimeType() ?: 'application/octet-stream';
        $isSvg = $extension === 'svg' || $mime === 'image/svg+xml';

        /** @var Cloud $publicDisk */
        $publicDisk = Storage::disk('public');

        if ($isSvg) {
            $realPath = $file->getRealPath();
            $rawContent = $realPath ? file_get_contents($realPath) : '';
            $sanitized = SvgSanitizer::sanitize($rawContent ?: '');
            $fileName = Str::random(40) . '.svg';
            $path = "brands/{$brand->id}/assets/{$fileName}";
            $publicDisk->put($path, $sanitized);
        } else {
            $path = $file->store("brands/{$brand->id}/assets", 'public');
        }

        $url = $publicDisk->url($path);

        $dimensions = null;
        if (str_starts_with($mime, 'image/') && $mime !== 'image/svg+xml') {
            $realPath = $file->getRealPath();
            $imageInfo = $realPath ? @getimagesize($realPath) : false;
            if ($imageInfo) {
                $dimensions = ['width' => $imageInfo[0], 'height' => $imageInfo[1]];
            }
        }

        $asset = BrandAsset::create([
            'brand_id' => $brand->id,
            'organization_id' => $orgId,
            'workspace_id' => $wsId,
            'name' => $name,
            'type' => $request->input('type'),
            'file_path' => $path,
            'file_url' => $url,
            'mime_type' => $mime,
            'size_bytes' => $file->getSize(),
            'dimensions' => $dimensions,
            'tags' => $request->input('tags', []),
        ]);

        AuditLogger::log('brand.asset_uploaded', $asset, null, ['name' => $name, 'type' => $asset->type], $orgId, $wsId);

        return response()->json([
            'success' => true,
            'data' => $asset,
            'message' => 'Asset uploaded successfully.',
        ], 201);
    }

    /**
     * Delete an asset.
     */
    public function destroy(Request $request, string $brandId, string $assetId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($brandId);
        /** @var BrandAsset $asset */
        $asset = $brand->assets()->where('organization_id', $orgId)->findOrFail($assetId);

        AuditLogger::log('brand.asset_deleted', $asset, ['name' => $asset->name], null, $orgId);

        // Optionally delete storage file
        /** @var Cloud $publicDisk */
        $publicDisk = Storage::disk('public');
        if ($asset->file_path && $publicDisk->exists($asset->file_path)) {
            $publicDisk->delete($asset->file_path);
        }

        $asset->delete();

        return response()->json([
            'success' => true,
            'message' => 'Asset deleted successfully.',
        ]);
    }
}
