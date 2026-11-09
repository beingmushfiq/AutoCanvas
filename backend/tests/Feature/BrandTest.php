<?php

namespace Tests\Feature;

use App\Modules\Billing\Models\Plan;
use App\Modules\Billing\Models\Subscription;
use App\Modules\Brand\Models\Brand;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BrandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        Storage::fake('public');
    }

    public function test_can_create_brand_and_generates_default_profiles(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Brand Owner',
            'email' => 'owner@brands.com',
            'password' => 'secret123',
            'organization_name' => 'Fashion Corp',
        ]);

        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', [
            'name' => 'Luxe Apparel',
            'industry' => 'Fashion & Apparel',
            'website_url' => 'https://luxeapparel.example.com',
            'primary_color' => '#1A1A1A',
            'secondary_color' => '#E5A93C',
            'primary_font' => 'Playfair Display',
            'business_description' => 'Premium sustainable fashion brand.',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Luxe Apparel',
                    'slug' => 'luxe-apparel',
                ],
            ]);

        $brandId = $response->json('data.id');

        // Verify full brand details endpoint includes profile, visual, voice
        $showRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->getJson("/api/v1/brands/{$brandId}");

        $showRes->assertStatus(200)
            ->assertJsonPath('data.name', 'Luxe Apparel')
            ->assertJsonPath('data.profile.business_description', 'Premium sustainable fashion brand.')
            ->assertJsonPath('data.visual_identity.primary_color', '#1A1A1A')
            ->assertJsonPath('data.visual_identity.primary_font', 'Playfair Display')
            ->assertJsonPath('data.voice_profile.formality_level', 'conversational');
    }

    public function test_enforces_plan_max_brands_limit(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Brand Owner',
            'email' => 'owner2@brands.com',
            'password' => 'secret123',
            'organization_name' => 'Limited Corp',
        ]);

        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');
        $orgId = $reg->json('data.organization.id');

        // Create first brand (allowed by Starter plan which has max_brands = 1)
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'Brand One'])->assertStatus(201);

        // Attempt second brand (must fail with 402 SUBSCRIPTION_LIMIT_EXCEEDED)
        $failRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'Brand Two']);

        $failRes->assertStatus(402);

        // Upgrade org to Growth plan (max_brands = 5)
        $growthPlan = Plan::where('slug', 'growth')->first();
        $sub = Subscription::where('organization_id', $orgId)->first();
        $sub->update(['plan_id' => $growthPlan->id]);

        // Now creating second brand succeeds
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'Brand Two'])->assertStatus(201);
    }

    public function test_cross_tenant_brand_isolation(): void
    {
        // Tenant A
        $regA = $this->postJson('/api/v1/auth/register', [
            'name' => 'Tenant A',
            'email' => 'a@brandcorp.com',
            'password' => 'password123',
            'organization_name' => 'Org A',
        ]);
        $tokenA = $regA->json('data.token');
        $wsA = $regA->json('data.workspace.id');

        $brandA = $this->withHeaders([
            'Authorization' => "Bearer {$tokenA}",
            'X-Workspace-Id' => $wsA,
        ])->postJson('/api/v1/brands', ['name' => 'Secret Brand A'])->json('data.id');

        auth('sanctum')->forgetUser();

        // Tenant B
        $regB = $this->postJson('/api/v1/auth/register', [
            'name' => 'Tenant B',
            'email' => 'b@brandcorp.com',
            'password' => 'password123',
            'organization_name' => 'Org B',
        ]);
        $tokenB = $regB->json('data.token');
        $wsB = $regB->json('data.workspace.id');

        auth('sanctum')->forgetUser();

        // Tenant B attempts to fetch Brand A -> 404 (scoped query fails to find it)
        $this->withHeaders([
            'Authorization' => "Bearer {$tokenB}",
            'X-Workspace-Id' => $wsB,
        ])->getJson("/api/v1/brands/{$brandA}")
            ->assertStatus(404);

        // Tenant B attempts to update Brand A's visual identity -> 404
        $this->withHeaders([
            'Authorization' => "Bearer {$tokenB}",
            'X-Workspace-Id' => $wsB,
        ])->putJson("/api/v1/brands/{$brandA}/visual", ['primary_color' => '#FF0000'])
            ->assertStatus(404);
    }

    public function test_can_update_brand_profile_visual_and_voice(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Editor',
            'email' => 'editor@brands.com',
            'password' => 'secret123',
            'organization_name' => 'Media Group',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');

        $brandId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'Tech Pulse'])->json('data.id');

        // Update Profile
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->putJson("/api/v1/brands/{$brandId}/profile", [
            'positioning' => 'Leading enterprise SaaS provider in APAC',
            'target_audience' => 'CTOs and VP of Engineering',
            'usps' => ['Autonomous scaling', 'SOC2 certified'],
            'primary_cta' => 'Book an Executive Demo',
        ])->assertStatus(200)
            ->assertJsonPath('data.positioning', 'Leading enterprise SaaS provider in APAC');

        // Update Visual
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->putJson("/api/v1/brands/{$brandId}/visual", [
            'primary_color' => '#0F172A',
            'secondary_color' => '#38BDF8',
            'accent_colors' => ['#F59E0B', '#10B981'],
        ])->assertStatus(200)
            ->assertJsonPath('data.primary_color', '#0F172A')
            ->assertJsonPath('data.accent_colors.0', '#F59E0B');

        // Update Voice
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->putJson("/api/v1/brands/{$brandId}/voice", [
            'personality_traits' => ['Authoritative', 'Innovative', 'Direct'],
            'formality_level' => 'technical',
            'channel_language_rules' => [
                'linkedin' => ['tone' => 'Thought leader, analytical, no buzzwords'],
                'facebook' => ['tone' => 'Friendly, community-focused'],
            ],
        ])->assertStatus(200)
            ->assertJsonPath('data.formality_level', 'technical')
            ->assertJsonPath('data.personality_traits.1', 'Innovative');
    }

    public function test_can_upload_and_list_brand_assets(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Designer',
            'email' => 'designer@brands.com',
            'password' => 'secret123',
            'organization_name' => 'Design Studio',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');

        $brandId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'Artisan Roasters'])->json('data.id');

        $file = UploadedFile::fake()->image('logo.png', 400, 200);

        $uploadRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/assets", [
            'file' => $file,
            'type' => 'logo',
            'name' => 'Primary Horizontal Logo',
            'tags' => ['primary', 'dark-mode'],
        ]);

        $uploadRes->assertStatus(201)
            ->assertJsonPath('data.name', 'Primary Horizontal Logo')
            ->assertJsonPath('data.type', 'logo')
            ->assertJsonPath('data.dimensions.width', 400);

        $assetId = $uploadRes->json('data.id');

        // List assets
        $listRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->getJson("/api/v1/brands/{$brandId}/assets");

        $listRes->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // Delete asset
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->deleteJson("/api/v1/brands/{$brandId}/assets/{$assetId}")
            ->assertStatus(200);
    }
}
