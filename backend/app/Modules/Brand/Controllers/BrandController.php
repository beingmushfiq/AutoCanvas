<?php

namespace App\Modules\Brand\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Billing\Services\EntitlementService;
use App\Modules\Brand\Models\Brand;
use App\Modules\Brand\Models\BrandProfile;
use App\Modules\Brand\Models\BrandVisualIdentity;
use App\Modules\Brand\Models\BrandVoiceProfile;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function __construct(
        protected EntitlementService $entitlementService
    ) {}

    /**
     * List all brands in the active workspace.
     */
    public function index(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');
        $wsId = app('current_workspace_id');

        $brands = Brand::with(['profile', 'visualIdentity', 'voiceProfile'])
            ->where('organization_id', $orgId)
            ->where('workspace_id', $wsId)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $brands->map(fn ($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'slug' => $b->slug,
                'industry' => $b->industry,
                'status' => $b->status,
                'primary_color' => $b->visualIdentity?->primary_color ?? '#101828',
                'secondary_color' => $b->visualIdentity?->secondary_color ?? '#6257E8',
                'primary_logo_url' => $b->visualIdentity?->primary_logo_url,
                'created_at' => $b->created_at->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Create a new brand with initial profile and visual identity.
     */
    public function store(Request $request): JsonResponse
    {
        $orgId = app('current_organization_id');
        $wsId = app('current_workspace_id');
        $organization = Organization::findOrFail($orgId);

        // Enforce subscription plan limit
        $this->entitlementService->assertCanCreateBrand($organization);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:100'],
            'website_url' => ['nullable', 'url', 'max:500'],
            'primary_color' => ['nullable', 'string', 'max:20'],
            'secondary_color' => ['nullable', 'string', 'max:20'],
            'primary_font' => ['nullable', 'string', 'max:100'],
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (Brand::where('workspace_id', $wsId)->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $brand = Brand::create([
            'organization_id' => $orgId,
            'workspace_id' => $wsId,
            'name' => $validated['name'],
            'slug' => $slug,
            'industry' => $validated['industry'] ?? null,
            'website_url' => $validated['website_url'] ?? null,
            'status' => 'active',
        ]);

        // Create initial related profiles
        BrandProfile::create([
            'brand_id' => $brand->id,
            'organization_id' => $orgId,
            'business_description' => $request->input('business_description'),
            'mission' => $request->input('mission'),
            'vision' => $request->input('vision'),
        ]);

        BrandVisualIdentity::create([
            'brand_id' => $brand->id,
            'organization_id' => $orgId,
            'primary_color' => $validated['primary_color'] ?? '#101828',
            'secondary_color' => $validated['secondary_color'] ?? '#6257E8',
            'primary_font' => $validated['primary_font'] ?? 'Inter',
        ]);

        BrandVoiceProfile::create([
            'brand_id' => $brand->id,
            'organization_id' => $orgId,
            'tone' => $request->input('tone', 'Confident, professional, engaging'),
            'formality_level' => 'conversational',
        ]);

        AuditLogger::log('brand.created', $brand, null, ['name' => $brand->name], $orgId, $wsId);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $brand->id,
                'name' => $brand->name,
                'slug' => $brand->slug,
            ],
            'message' => 'Brand created successfully.',
        ], 201);
    }

    /**
     * Show full brand details.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::with(['profile', 'visualIdentity', 'voiceProfile'])
            ->where('organization_id', $orgId)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $brand->id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'industry' => $brand->industry,
                'website_url' => $brand->website_url,
                'status' => $brand->status,
                'profile' => $brand->profile,
                'visual_identity' => $brand->visualIdentity,
                'voice_profile' => $brand->voiceProfile,
                'sources_count' => $brand->knowledgeSources()->count(),
                'memory_entries_count' => $brand->memoryEntries()->count(),
                'created_at' => $brand->created_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Update business positioning profile.
     */
    public function updateProfile(Request $request, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($id);
        $profile = $brand->profile ?: new BrandProfile(['brand_id' => $brand->id, 'organization_id' => $orgId]);

        $validated = $request->validate([
            'business_description' => ['nullable', 'string'],
            'mission' => ['nullable', 'string'],
            'vision' => ['nullable', 'string'],
            'positioning' => ['nullable', 'string'],
            'products_services' => ['nullable', 'array'],
            'target_audience' => ['nullable', 'string'],
            'personas' => ['nullable', 'array'],
            'usps' => ['nullable', 'array'],
            'primary_cta' => ['nullable', 'string', 'max:100'],
            'secondary_cta' => ['nullable', 'string', 'max:100'],
            'prohibited_subjects' => ['nullable', 'array'],
        ]);

        $profile->fill($validated)->save();

        AuditLogger::log('brand.profile_updated', $brand, null, $validated, $orgId);

        return response()->json([
            'success' => true,
            'data' => $profile,
            'message' => 'Brand profile updated successfully.',
        ]);
    }

    /**
     * Update visual identity rules.
     */
    public function updateVisual(Request $request, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($id);
        $visual = $brand->visualIdentity ?: new BrandVisualIdentity(['brand_id' => $brand->id, 'organization_id' => $orgId]);

        $validated = $request->validate([
            'primary_color' => ['sometimes', 'string', 'max:20'],
            'secondary_color' => ['sometimes', 'string', 'max:20'],
            'accent_colors' => ['nullable', 'array'],
            'primary_font' => ['sometimes', 'string', 'max:100'],
            'secondary_font' => ['sometimes', 'string', 'max:100'],
            'primary_logo_url' => ['nullable', 'string', 'max:1000'],
            'secondary_logo_url' => ['nullable', 'string', 'max:1000'],
            'layout_preferences' => ['nullable', 'array'],
            'visual_exclusions' => ['nullable', 'array'],
        ]);

        $visual->fill($validated)->save();

        AuditLogger::log('brand.visual_updated', $brand, null, $validated, $orgId);

        return response()->json([
            'success' => true,
            'data' => $visual,
            'message' => 'Visual identity updated successfully.',
        ]);
    }

    /**
     * Update brand voice and tone.
     */
    public function updateVoice(Request $request, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($id);
        $voice = $brand->voiceProfile ?: new BrandVoiceProfile(['brand_id' => $brand->id, 'organization_id' => $orgId]);

        $validated = $request->validate([
            'personality_traits' => ['nullable', 'array'],
            'tone' => ['sometimes', 'string', 'max:255'],
            'communication_style' => ['nullable', 'string'],
            'preferred_language' => ['sometimes', 'string', 'max:20'],
            'formality_level' => ['sometimes', 'string', 'in:formal,casual,conversational,technical'],
            'channel_language_rules' => ['nullable', 'array'],
        ]);

        $voice->fill($validated)->save();

        AuditLogger::log('brand.voice_updated', $brand, null, $validated, $orgId);

        return response()->json([
            'success' => true,
            'data' => $voice,
            'message' => 'Brand voice updated successfully.',
        ]);
    }

    /**
     * Delete brand.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $orgId = app('current_organization_id');
        $brand = Brand::where('organization_id', $orgId)->findOrFail($id);

        AuditLogger::log('brand.deleted', $brand, ['name' => $brand->name], null, $orgId);

        $brand->delete();

        return response()->json([
            'success' => true,
            'message' => 'Brand deleted successfully.',
        ]);
    }
}
