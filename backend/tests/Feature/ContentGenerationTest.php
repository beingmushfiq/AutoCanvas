<?php

namespace Tests\Feature;

use App\AI\Models\AiUsageRecord;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ContentGenerationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        Storage::fake('public');
    }

    public function test_can_generate_multi_platform_content_with_creative_and_token_accounting(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Content Director',
            'email' => 'director@brand.com',
            'password' => 'secret123',
            'organization_name' => 'Growth Agency',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');
        $orgId = $reg->json('data.organization.id');

        $brandId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', [
            'name' => 'CyberGuard AI',
            'industry' => 'Cybersecurity SaaS',
            'primary_color' => '#0F172A',
            'secondary_color' => '#6366F1',
        ])->json('data.id');

        // Create Content Pillar
        $pillarId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/pillars", [
            'name' => 'Security Architecture',
            'weight_percentage' => 40,
        ])->json('data.id');

        // Ingest Knowledge Source
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/knowledge/upload", [
            'title' => 'SOC2 Certification Brief',
            'content' => 'CyberGuard AI has attained SOC2 Type II compliance with zero non-conformances in 2026.',
        ])->assertStatus(201);

        // Generate Multi-Platform Content
        $genRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/content/generate", [
            'topic' => 'SOC2 Type II Compliance and Enterprise Trust',
            'content_pillar_id' => $pillarId,
            'platforms' => ['linkedin', 'facebook', 'instagram'],
            'generate_creative' => true,
            'use_knowledge' => true,
        ]);

        $genRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.content_pillar_id', $pillarId);

        $contentItem = $genRes->json('data');
        $this->assertCount(3, $contentItem['variants']);

        // Check LinkedIn variant has appropriate hashtags and caption
        $linkedin = collect($contentItem['variants'])->firstWhere('platform', 'linkedin');
        $this->assertNotNull($linkedin);
        $this->assertNotEmpty($linkedin['caption']);
        $this->assertNotEmpty($linkedin['hashtags']);
        $this->assertNotEmpty($linkedin['media_urls']);

        // Verify token accounting in ai_usage_records
        $this->assertDatabaseHas('ai_usage_records', [
            'organization_id' => $orgId,
            'brand_id' => $brandId,
            'task_type' => 'content_production',
            'provider' => 'mock',
        ]);

        $usage = AiUsageRecord::where('brand_id', $brandId)->first();
        $this->assertNotNull($usage);
        $this->assertGreaterThan(0, $usage->input_tokens);
    }
}
