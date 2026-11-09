<?php

namespace Tests\Feature;

use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrandMemoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_can_manage_brand_memory_entries(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Memory Curator',
            'email' => 'curator@brand.com',
            'password' => 'secret123',
            'organization_name' => 'Memory Corp',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');

        $brandId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'Nordic Ware'])->json('data.id');

        // Create approved fact
        $storeRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/memory", [
            'category' => 'approved_fact',
            'title' => 'Product Pricing Rule',
            'content' => 'Annual subscription includes 2 months free. Never state that monthly billing is cheaper.',
            'confidence_score' => 1.0,
        ]);

        $storeRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Product Pricing Rule');

        $memoryId = $storeRes->json('data.id');

        // List memories
        $listRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->getJson("/api/v1/brands/{$brandId}/memory");

        $listRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.category', 'approved_fact');

        // Delete memory entry
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->deleteJson("/api/v1/brands/{$brandId}/memory/{$memoryId}")
            ->assertStatus(200);

        // Verify empty list
        $emptyRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->getJson("/api/v1/brands/{$brandId}/memory");

        $emptyRes->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
