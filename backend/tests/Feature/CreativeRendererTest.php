<?php

namespace Tests\Feature;

use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CreativeRendererTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        Storage::fake('public');
    }

    public function test_creative_rendering_endpoints_and_variant_binding(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Art Director',
            'email' => 'art@agency.com',
            'password' => 'secret123',
            'organization_name' => 'Creative Agency',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');

        $brandId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', [
            'name' => 'Nova Dynamics',
            'primary_color' => '#18181B',
            'secondary_color' => '#3B82F6',
        ])->json('data.id');

        // 1. List Templates
        $tplRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->getJson('/api/v1/creative/templates');

        $tplRes->assertStatus(200)
            ->assertJsonPath('success', true);
        $this->assertGreaterThanOrEqual(4, count($tplRes->json('data')));

        // 2. Direct On-the-fly Render
        $renderRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/creative/render', [
            'brand_id' => $brandId,
            'headline' => 'Next-Gen Autonomous Operations',
            'supporting_text' => 'Scale without operational drag.',
            'call_to_action' => 'Get Started',
            'template_id' => 'minimal_corporate_v1',
            'width' => 1080,
            'height' => 1080,
        ]);

        $renderRes->assertStatus(200)
            ->assertJsonPath('success', true);
        $this->assertNotEmpty($renderRes->json('data.file_url'));

        // 3. Create Draft Post with Variant and Bind Rendered Creative
        $postRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/content/generate", [
            'topic' => 'Product Launch Teaser',
            'platforms' => ['linkedin'],
            'generate_creative' => false,
        ]);

        $variantId = $postRes->json('data.variants.0.id');

        // Render specifically for this variant
        $variantRenderRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/content/variants/{$variantId}/render-creative", [
            'headline' => 'Nova Dynamics 2.0 is Live',
            'supporting_text' => 'Deploy high-velocity social operations.',
            'call_to_action' => 'Try It Free',
        ]);

        $variantRenderRes->assertStatus(200)
            ->assertJsonPath('success', true);
        $this->assertNotEmpty($variantRenderRes->json('data.variant.media_urls'));
    }
}
