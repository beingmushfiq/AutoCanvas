<?php

namespace Tests\Feature;

use App\Modules\Billing\Models\Plan;
use App\Modules\Billing\Models\Subscription;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KnowledgeIngestionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_can_ingest_raw_text_and_generates_chunks(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Knowledge Manager',
            'email' => 'km@brand.com',
            'password' => 'secret123',
            'organization_name' => 'Knowledge Corp',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');

        $brandId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'Brand Alpha'])->json('data.id');

        $longText = str_repeat('AutoCanvas provides autonomous social media orchestration with strict brand voice compliance. ', 30);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/knowledge/upload", [
            'title' => 'Brand Strategy Whitepaper 2026',
            'content' => $longText,
            'credibility' => 'A',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.display_name', 'Brand Strategy Whitepaper 2026')
            ->assertJsonPath('data.credibility', 'A');

        $this->assertGreaterThan(0, $response->json('data.chunks_count'));

        // List sources
        $listRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->getJson("/api/v1/brands/{$brandId}/knowledge");

        $listRes->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_ssrf_protection_blocks_internal_and_metadata_ips(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Security Tester',
            'email' => 'sec@brand.com',
            'password' => 'secret123',
            'organization_name' => 'Security Corp',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');

        $brandId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'Sec Brand'])->json('data.id');

        $forbiddenUrls = [
            'http://127.0.0.1:8000/internal-secrets',
            'http://169.254.169.254/latest/meta-data/',
            'http://10.0.0.1/admin',
            'http://192.168.1.1/router',
        ];

        foreach ($forbiddenUrls as $badUrl) {
            $res = $this->withHeaders([
                'Authorization' => "Bearer {$token}",
                'X-Workspace-Id' => $wsId,
            ])->postJson("/api/v1/brands/{$brandId}/knowledge/url", [
                'url' => $badUrl,
            ]);

            $res->assertStatus(422)
                ->assertJsonValidationErrors(['url']);
        }
    }

    public function test_retrieval_service_is_strictly_scoped_to_brand_and_organization(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Multi Brand Manager',
            'email' => 'multi@brand.com',
            'password' => 'secret123',
            'organization_name' => 'Enterprise Corp',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');
        $orgId = $reg->json('data.organization.id');

        // Upgrade org to Growth to allow 2 brands
        $growthPlan = Plan::where('slug', 'growth')->first();
        Subscription::where('organization_id', $orgId)->first()->update(['plan_id' => $growthPlan->id]);

        // Brand A: Organic Tea
        $brandAId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'GreenLeaf Tea'])->json('data.id');

        // Brand B: Cloud Hosting
        $brandBId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'CloudScale Host'])->json('data.id');

        // Ingest GreenLeaf knowledge
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandAId}/knowledge/upload", [
            'title' => 'Tea Brewing Guide',
            'content' => 'Harvested in Sylhet gardens, our artisan chamomile and green tea leaves are dried naturally.',
        ])->assertStatus(201);

        // Ingest CloudScale knowledge
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandBId}/knowledge/upload", [
            'title' => 'Server Architecture',
            'content' => 'High performance NVMe storage cluster with 99.99% uptime guarantee and kubernetes autoscaling.',
        ])->assertStatus(201);

        // Search in Brand A for "tea leaves" -> returns match with citation
        $searchResA = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandAId}/knowledge/search", [
            'query' => 'tea leaves brewing',
        ]);

        $searchResA->assertStatus(200)
            ->assertJsonPath('success', true);
        $this->assertNotEmpty($searchResA->json('data'));
        $this->assertStringContainsString('Sylhet gardens', $searchResA->json('data.0.content'));
        $this->assertStringContainsString('Tea Brewing Guide', $searchResA->json('data.0.citation'));

        // Search in Brand A for "kubernetes cluster" -> 0 matches (brand B's knowledge does NOT leak)
        $searchResLeak = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandAId}/knowledge/search", [
            'query' => 'kubernetes cluster uptime',
        ]);

        $searchResLeak->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
