<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Automation\Models\BrandCadenceSetting;
use App\Modules\Automation\Services\AutonomousAutopilotEngine;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ControlPlane\Models\SystemSetting;
use App\Modules\Organization\Models\Organization;
use App\Modules\Research\Models\ContentFingerprint;
use App\Modules\Research\Models\DiscoveredSource;
use App\Modules\Research\Services\ArticleReadabilityExtractor;
use App\Modules\Research\Services\NoveltyVerificationEngine;
use App\Modules\Research\Services\RelatedSourceDiscoveryService;
use App\Modules\Workspace\Models\Workspace;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutonomousIntelligenceAndNoveltyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $org;
    protected Workspace $workspace;
    protected Brand $brand;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RbacSeeder::class);

        $this->org = Organization::create([
            'name' => 'Acme Global Ventures',
            'slug' => 'acme-global',
            'billing_email' => 'billing@acmeglobal.com',
            'plan_type' => 'enterprise',
        ]);

        $this->workspace = Workspace::create([
            'organization_id' => $this->org->id,
            'name' => 'EMEA Marketing Operations',
            'slug' => 'emea-marketing',
        ]);

        $this->user = User::create([
            'name' => 'Dr. Elena Rostova',
            'email' => 'elena@acmeglobal.com',
            'password' => bcrypt('password123'),
            'is_platform_admin' => true,
            'organization_id' => $this->org->id,
        ]);
        $this->user->assignRole('superadmin');

        $this->brand = Brand::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'name' => 'FintechPulse',
            'slug' => 'fintech-pulse',
            'industry' => 'Finance',
            'website_url' => 'https://fintechpulse.io',
            'status' => 'active',
        ]);

        app()->instance('current_organization_id', $this->org->id);
    }

    public function test_related_source_discovery_generates_sources(): void
    {
        $service = new RelatedSourceDiscoveryService();
        $sources = $service->discoverSources($this->brand, ['limit' => 3]);

        $this->assertNotEmpty($sources);
        $this->assertDatabaseHas('discovered_sources', [
            'brand_id' => $this->brand->id,
            'status' => 'active',
        ]);

        $first = $sources->first();
        $this->assertGreaterThanOrEqual(75, $first->relevance_score);
        $this->assertGreaterThanOrEqual(70, $first->authority_score);
    }

    public function test_article_readability_extractor_parses_html(): void
    {
        $extractor = new ArticleReadabilityExtractor();
        $sampleHtml = <<<HTML
        <!DOCTYPE html>
        <html>
        <head><title>Breaking: Open Source AI Surpasses Proprietary LLMs</title></head>
        <body>
            <nav><a href="#">Home</a></nav>
            <header>Ad Banner</header>
            <p>San Francisco, CA — In a historic milestone for artificial intelligence, new open-weights models developed by global research consortiums have achieved unprecedented benchmark accuracy.</p>
            <p>Industry analysts at Gartner confirm that developer adoption increased by over 340 percent year over year across enterprise cloud workloads.</p>
            <footer>Copyright 2026 TechPulse Media. All rights reserved.</footer>
        </body>
        </html>
        HTML;

        $result = $extractor->extractFromHtml($sampleHtml, 'https://techpulse.io/articles/open-source-ai');

        $this->assertEquals('Breaking: Open Source AI Surpasses Proprietary LLMs', $result['title']);
        $this->assertEquals('techpulse.io', $result['domain']);
        $this->assertStringContainsString('historic milestone for artificial intelligence', $result['body']);
        $this->assertStringNotContainsString('Ad Banner', $result['body']);
        $this->assertStringNotContainsString('Copyright 2026', $result['body']);
        $this->assertGreaterThan(20, $result['word_count']);
    }

    public function test_simhash_lexical_deduplication_rejects_identical_or_near_identical_hooks(): void
    {
        $engine = new NoveltyVerificationEngine();

        $textA = "Why traditional cloud storage is failing modern AI engineers in 2026";
        $conceptA = "Cloud storage bottlenecks";
        $textB = "Why traditional cloud storage is failing modern AI engineers in 2026"; // Exact duplicate
        $conceptB = "Cloud storage bottlenecks";

        $hashA = $engine->calculateSimHash64($textA . ' ' . $conceptA);
        $hashB = $engine->calculateSimHash64($textB . ' ' . $conceptB);

        $dist = $engine->hammingDistance($hashA, $hashB);
        $this->assertEquals(0, $dist);

        // Register fingerprint A
        ContentFingerprint::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'content_item_id' => null,
            'channel' => 'linkedin',
            'simhash_64' => $hashA,
            'concept_summary' => $conceptA,
            'hook_text' => $textA,
            'creative_template_id' => 'breaking_news_card',
            'published_or_scheduled_at' => now(),
        ]);

        // Evaluate candidate B
        $report = $engine->evaluateNovelty(
            $this->brand,
            'linkedin',
            $textB,
            $conceptB,
            'data_stat_callout'
        );

        $this->assertFalse($report['is_novel']);
        $this->assertEquals('lexical_duplicate_simhash', $report['rejection_reason']);
        $this->assertLessThanOrEqual(4, $report['min_hamming_distance']);
        $this->assertNotEmpty($report['mutated_angle']);
    }

    public function test_vector_cosine_gate_rejects_paraphrased_duplicate_concepts(): void
    {
        $engine = new NoveltyVerificationEngine();

        // 1. Orthogonal vector test
        $vecA = [1.0, 0.0, 0.0];
        $vecB = [0.0, 1.0, 0.0];
        $this->assertEquals(0.0, $engine->cosineSimilarity($vecA, $vecB));

        // 2. High similarity vector test (same idea paraphrased)
        $vecPast = [0.85, 0.45, 0.10];
        $vecCandidate = [0.88, 0.43, 0.09];
        $sim = $engine->cosineSimilarity($vecPast, $vecCandidate);
        $this->assertGreaterThan(0.95, $sim);

        // Register past fingerprint with vector
        ContentFingerprint::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'content_item_id' => null,
            'channel' => 'linkedin',
            'simhash_64' => 123456789,
            'concept_summary' => 'Decentralized data architectures',
            'hook_text' => 'Completely unique wording alpha omega',
            'embedding_vector' => $vecPast,
            'creative_template_id' => 'data_stat_callout',
            'published_or_scheduled_at' => now(),
        ]);

        $report = $engine->evaluateNovelty(
            $this->brand,
            'linkedin',
            'Brand new lexical sentence with zero matching words',
            'Decentralized data architectures paraphrased',
            'data_stat_callout',
            $vecCandidate
        );

        $this->assertFalse($report['is_novel']);
        $this->assertEquals('conceptual_duplicate_vector', $report['rejection_reason']);
        $this->assertGreaterThanOrEqual(0.72, $report['max_cosine_similarity']);
        $this->assertNotEmpty($report['mutated_angle']);
    }

    public function test_creative_template_fatigue_rotator_enforces_archetype_cooldown(): void
    {
        $engine = new NoveltyVerificationEngine();

        // Register 2 consecutive posts with 'minimal_corporate_v1'
        for ($i = 0; $i < 2; $i++) {
            ContentFingerprint::create([
                'organization_id' => $this->org->id,
                'workspace_id' => $this->workspace->id,
                'brand_id' => $this->brand->id,
                'content_item_id' => null,
                'channel' => 'instagram',
                'simhash_64' => rand(1000000, 9999999),
                'concept_summary' => "Post {$i}",
                'hook_text' => "Hook {$i}",
                'creative_template_id' => 'minimal_corporate_v1',
                'published_or_scheduled_at' => now()->subHours(2 - $i),
            ]);
        }

        // Attempt to generate 3rd consecutive post with minimal_corporate_v1
        $report = $engine->evaluateNovelty(
            $this->brand,
            'instagram',
            'Completely novel hook text zebra kangaroo',
            'Completely novel concept quantum computing',
            'minimal_corporate_v1'
        );

        $this->assertFalse($report['is_novel']);
        $this->assertEquals('template_fatigue', $report['rejection_reason']);
        $this->assertNotEquals('minimal_corporate_v1', $report['recommended_template']);
    }

    public function test_autopilot_engine_fulfills_empty_cadence_slots(): void
    {
        $engine = app(AutonomousAutopilotEngine::class);

        $report = $engine->runCycle($this->brand);

        $this->assertEquals('success', $report['status']);
        $this->assertEquals($this->brand->name, $report['brand']);
        $this->assertGreaterThanOrEqual(1, $report['sources_discovered']);
        $this->assertGreaterThanOrEqual(1, $report['posts_minted']);

        // Assert ContentItem was created and scheduled
        $this->assertDatabaseHas('content_items', [
            'brand_id' => $this->brand->id,
        ]);

        // Assert ContentFingerprint was registered
        $this->assertDatabaseHas('content_fingerprints', [
            'brand_id' => $this->brand->id,
        ]);
    }

    public function test_autopilot_respects_emergency_circuit_breaker(): void
    {
        // Trip circuit breaker
        SystemSetting::updateOrCreate(
            ['key' => 'pause_all_automations'],
            ['value' => true, 'category' => 'emergency', 'is_secret' => false]
        );

        $engine = app(AutonomousAutopilotEngine::class);
        $report = $engine->runCycle($this->brand);

        $this->assertEquals('circuit_breaker_paused', $report['status']);
        $this->assertEquals(0, $report['posts_minted']);
    }

    public function test_harvest_hourly_intelligence_artisan_command(): void
    {
        $exitCode = $this->artisan('intelligence:harvest-and-synthesize', [
            '--brand' => $this->brand->id,
        ])->run();

        $this->assertEquals(0, $exitCode);
    }

    public function test_autopilot_controller_endpoints(): void
    {
        $token = $this->user->createToken('test-token')->plainTextToken;

        // 1. GET /api/v1/autopilot/cadence
        $res1 = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Workspace-Id', $this->workspace->id)
            ->getJson("/api/v1/autopilot/cadence?brand_id={$this->brand->id}");

        $res1->assertStatus(200);
        $res1->assertJsonPath('success', true);
        $res1->assertJsonPath('data.brand_id', $this->brand->id);

        // 2. POST /api/v1/autopilot/cadence
        $res2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Workspace-Id', $this->workspace->id)
            ->postJson("/api/v1/autopilot/cadence?brand_id={$this->brand->id}", [
                'autopilot_mode' => 'assisted_autopilot',
                'weekly_schedule' => [
                    ['day' => 'tue', 'time' => '11:00', 'channel' => 'linkedin'],
                    ['day' => 'thu', 'time' => '15:00', 'channel' => 'instagram'],
                ],
                'novelty_threshold_cosine' => 0.750,
                'max_daily_posts_per_channel' => 3,
                'require_consensus_for_breaking_news' => true,
                'is_active' => true,
            ]);

        $res2->assertStatus(200);
        $res2->assertJsonPath('data.autopilot_mode', 'assisted_autopilot');

        // 3. GET /api/v1/autopilot/radar
        $res3 = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Workspace-Id', $this->workspace->id)
            ->getJson("/api/v1/autopilot/radar?brand_id={$this->brand->id}");

        $res3->assertStatus(200);
        $res3->assertJsonStructure([
            'success',
            'data' => [
                'brand',
                'pulse' => ['last_scoured_at', 'autopilot_mode', 'is_active', 'total_sources'],
                'emerging_clusters',
                'recent_fingerprints',
            ],
        ]);

        // 4. POST /api/v1/autopilot/trigger
        $res4 = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Workspace-Id', $this->workspace->id)
            ->postJson("/api/v1/autopilot/trigger?brand_id={$this->brand->id}");

        $res4->assertStatus(200);
        $res4->assertJsonPath('data.status', 'success');

        // 5. GET /api/v1/autopilot/discovered-sources
        $res5 = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Workspace-Id', $this->workspace->id)
            ->getJson("/api/v1/autopilot/discovered-sources?brand_id={$this->brand->id}");

        $res5->assertStatus(200);
        $res5->assertJsonPath('success', true);

        // 6. GET /api/v1/autopilot/fingerprints
        $res6 = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Workspace-Id', $this->workspace->id)
            ->getJson("/api/v1/autopilot/fingerprints?brand_id={$this->brand->id}");

        $res6->assertStatus(200);
        $res6->assertJsonPath('success', true);
    }
}
