<?php

namespace App\Modules\ContentProduction\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\Organization\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentVariantController extends Controller
{
    /**
     * Update a specific platform variant caption, hashtags, and CTA.
     */
    public function update(Request $request, string $variantId): JsonResponse
    {
        $orgId = app('current_organization_id');
        $variant = ContentVariant::where('organization_id', $orgId)->findOrFail($variantId);

        $validated = $request->validate([
            'caption' => ['sometimes', 'string'],
            'hashtags' => ['nullable', 'array'],
            'cta_text' => ['nullable', 'string', 'max:255'],
            'cta_url' => ['nullable', 'url', 'max:500'],
            'media_urls' => ['nullable', 'array'],
        ]);

        if (isset($validated['caption'])) {
            $validated['character_count'] = mb_strlen($validated['caption']);
        }

        $variant->update($validated);

        AuditLogger::log('content_variant.updated', $variant, null, [
            'platform' => $variant->platform,
            'caption_length' => $variant->character_count,
        ], $orgId);

        return response()->json([
            'success' => true,
            'data' => $variant,
            'message' => 'Platform variant updated successfully.',
        ]);
    }
}
