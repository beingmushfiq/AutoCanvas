<?php

namespace Tests\Feature;

use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentPillarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_can_manage_brand_content_pillars(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Strategist',
            'email' => 'strat@brand.com',
            'password' => 'secret123',
            'organization_name' => 'Strategy Corp',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');

        $brandId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'Omni Brand'])->json('data.id');

        // 1. Create Pillar
        $createRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/pillars", [
            'name' => 'Thought Leadership',
            'description' => 'Deep-dive industry insights and proprietary research',
            'target_audience' => 'VP of Engineering, CTOs',
            'weight_percentage' => 35,
            'color_tag' => '#6257E8',
        ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Thought Leadership')
            ->assertJsonPath('data.weight_percentage', 35);

        $pillarId = $createRes->json('data.id');

        // 2. List Pillars
        $listRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->getJson("/api/v1/brands/{$brandId}/pillars");

        $listRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Thought Leadership');

        // 3. Update Pillar
        $updateRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->putJson("/api/v1/brands/{$brandId}/pillars/{$pillarId}", [
            'weight_percentage' => 40,
            'color_tag' => '#10B981',
        ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.weight_percentage', 40)
            ->assertJsonPath('data.color_tag', '#10B981');

        // 4. Delete Pillar
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->deleteJson("/api/v1/brands/{$brandId}/pillars/{$pillarId}")
            ->assertStatus(200);

        // List should now be empty
        $emptyRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->getJson("/api/v1/brands/{$brandId}/pillars");

        $emptyRes->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
