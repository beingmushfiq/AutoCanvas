<?php

namespace Tests\Feature;

use App\AI\Models\AiUsageRecord;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrandDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_ai_brand_discovery_synthesizes_profile_and_meters_usage(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Founder AI',
            'email' => 'founder@ai.com',
            'password' => 'secret123',
            'organization_name' => 'Innovate Tech',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');
        $orgId = $reg->json('data.organization.id');

        $brandId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'Athletix Pro'])->json('data.id');

        $referenceGuidelines = <<<'TEXT'
Athletix Pro is an elite high-performance athletic apparel brand designed for hybrid athletes.
We engineer breathable, compression-engineered garments utilizing carbon-neutral recycled ocean polymers.
Our aesthetic is minimal, high-contrast monochrome with fierce crimson accents.
TEXT;

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/discovery", [
            'text' => $referenceGuidelines,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.positioning', 'Premium, science-backed athletic lifestyle for disciplined professionals.')
            ->assertJsonPath('data.primary_color', '#0F172A')
            ->assertJsonPath('data.secondary_color', '#E11D48')
            ->assertJsonPath('meta.requires_confirmation', true);

        // Verify token accounting and cost tracking in ai_usage_records
        $this->assertDatabaseHas('ai_usage_records', [
            'organization_id' => $orgId,
            'brand_id' => $brandId,
            'task_type' => 'brand_discovery',
            'provider' => 'mock',
        ]);

        $usage = AiUsageRecord::where('brand_id', $brandId)->first();
        $this->assertNotNull($usage);
        $this->assertGreaterThan(0, $usage->input_tokens);
        $this->assertGreaterThan(0, $usage->output_tokens);
    }
}
