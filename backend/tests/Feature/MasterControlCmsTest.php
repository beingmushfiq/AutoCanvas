<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\ControlPlane\Models\AiPromptTemplate;
use App\Modules\ControlPlane\Models\CmsBlock;
use App\Modules\ControlPlane\Models\CustomThemeOverride;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use Database\Seeders\ControlPlaneSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MasterControlCmsTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected string $adminToken;
    protected User $regularUser;
    protected string $userToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        $this->seed(RbacSeeder::class);
        $this->seed(ControlPlaneSeeder::class);

        // Superadmin User
        $this->superAdmin = User::create([
            'name' => 'Sovereign Controller',
            'email' => 'superadmin@autocanvas.io',
            'password' => bcrypt('password123'),
            'is_platform_admin' => true,
            'status' => 'active',
        ]);
        $this->superAdmin->assignRole('superadmin');
        $this->adminToken = $this->superAdmin->createToken('admin_token')->plainTextToken;

        // Regular Tenant User
        $this->regularUser = User::create([
            'name' => 'Tenant User',
            'email' => 'tenant@company.com',
            'password' => bcrypt('password123'),
            'is_platform_admin' => false,
            'status' => 'active',
        ]);
        $this->userToken = $this->regularUser->createToken('user_token')->plainTextToken;
    }

    public function test_public_landing_data_is_accessible_without_auth_and_has_devcenterpoint_branding(): void
    {
        $res = $this->getJson('/api/v1/cms/public-data');
        $res->assertStatus(200);
        $res->assertJsonPath('success', true);
        $res->assertJsonPath('data.branding.creator_name', 'DevCenterPoint');
        $res->assertJsonPath('data.branding.creator_url', 'https://devcenterpoint.com');
        $res->assertJsonStructure([
            'data' => [
                'branding',
                'hero',
                'features',
                'comparison',
                'pricing',
                'faq',
            ],
        ]);
    }

    public function test_cms_management_rejects_unauthenticated_or_regular_users(): void
    {
        // Unauthenticated
        $this->getJson('/api/v1/control-plane/cms/blocks')
            ->assertStatus(401);

        // Regular user without platform.admin
        $this->withHeader('Authorization', 'Bearer ' . $this->userToken)
            ->getJson('/api/v1/control-plane/cms/blocks')
            ->assertStatus(403);
    }

    public function test_superadmin_can_retrieve_and_update_cms_blocks(): void
    {
        // Get all blocks
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/control-plane/cms/blocks');
        $res->assertStatus(200);
        $res->assertJsonPath('success', true);
        $res->assertJsonStructure(['data' => ['hero', 'features', 'comparison', 'pricing', 'faq']]);

        // Update hero block
        $newHero = [
            'badge' => 'Engineered by DevCenterPoint',
            'headline_line1' => 'Autonomous Social Ops',
            'headline_line2' => 'Zero Duplication Ever',
            'subtitle' => 'Customized live via Master Control CMS',
            'primary_cta_text' => 'Get Started Now',
            'primary_cta_link' => '#auth',
            'secondary_cta_text' => 'Try Live Demo',
            'secondary_cta_link' => '/workspace/overview',
            'metrics_banner' => [
                ['label' => 'Continuous Scouring', 'value' => 'Every 60m'],
            ],
        ];

        $updateRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/control-plane/cms/blocks/hero', [
                'title' => 'Customized Master Hero',
                'content_json' => $newHero,
            ]);

        $updateRes->assertStatus(200);
        $updateRes->assertJsonPath('data.title', 'Customized Master Hero');

        // Verify public data reflects the updated block immediately
        $publicRes = $this->getJson('/api/v1/cms/public-data');
        $publicRes->assertStatus(200);
        $publicRes->assertJsonPath('data.hero.headline_line1', 'Autonomous Social Ops');

        // Verify SystemChangeLog was recorded
        $this->assertDatabaseHas('system_change_logs', [
            'action' => 'cms.block_updated',
            'user_id' => $this->superAdmin->id,
        ]);
    }

    public function test_superadmin_can_update_theme_and_whitelabel_overrides(): void
    {
        $payload = [
            'platform_name' => 'AutoCanvas Enterprise',
            'tagline' => 'Sovereign Brand Intelligence by DevCenterPoint',
            'creator_name' => 'DevCenterPoint',
            'creator_url' => 'https://devcenterpoint.com',
            'primary_color_hex' => '#0F172A',
            'accent_color_hex' => '#F59E0B',
            'custom_css' => ':root { --custom-accent: #f59e0b; }',
            'announcement_banner' => [
                'enabled' => true,
                'text' => 'AutoCanvas 2.0 Released with 3-Layer Novelty Engine',
                'link' => 'https://devcenterpoint.com',
            ],
        ];

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/control-plane/cms/theme', $payload);

        $res->assertStatus(200);
        $res->assertJsonPath('data.platform_name', 'AutoCanvas Enterprise');
        $res->assertJsonPath('data.announcement_banner.enabled', true);

        // Verify public data updated
        $publicRes = $this->getJson('/api/v1/cms/public-data');
        $publicRes->assertJsonPath('data.branding.platform_name', 'AutoCanvas Enterprise');
        $publicRes->assertJsonPath('data.branding.announcement_banner.text', 'AutoCanvas 2.0 Released with 3-Layer Novelty Engine');
    }

    public function test_superadmin_can_manage_ai_prompt_foundry_and_rollback(): void
    {
        // Get all prompts
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/control-plane/cms/prompts');
        $res->assertStatus(200);
        $res->assertJsonPath('success', true);

        // Save a new version of headline_hook
        $newTemplate = "You are an elite editorial writer. Craft a gripping hook for {topic}. No corporate jargon.";
        $saveRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/control-plane/cms/prompts/headline_hook', [
                'prompt_template' => $newTemplate,
                'model_override' => 'claude-3-5-sonnet',
                'temperature' => 0.55,
                'max_tokens' => 450,
                'change_summary' => 'Refined hook brevity and tension rules',
            ]);

        $saveRes->assertStatus(200);
        $saveRes->assertJsonPath('data.version', 2);
        $saveRes->assertJsonPath('data.is_active', true);

        // Verify version 1 is now inactive
        $v1 = AiPromptTemplate::where('task_type', 'headline_hook')->where('version', 1)->first();
        $this->assertFalse($v1->is_active);

        // Rollback to version 1
        $rollbackRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/control-plane/cms/prompts/headline_hook/rollback', [
                'target_version' => 1,
            ]);

        $rollbackRes->assertStatus(200);
        $rollbackRes->assertJsonPath('data.version', 1);
        $rollbackRes->assertJsonPath('data.is_active', true);

        $v2 = AiPromptTemplate::where('task_type', 'headline_hook')->where('version', 2)->first();
        $this->assertFalse($v2->is_active);
    }

    public function test_superadmin_can_tune_crawler_and_novelty_parameters(): void
    {
        // Get initial tuning parameters
        $getRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/control-plane/crawler-tuning');
        $getRes->assertStatus(200);
        $getRes->assertJsonPath('data.simhash_hamming_cutoff', 4);
        $getRes->assertJsonPath('data.vector_cosine_cutoff', 0.72);

        // Update tuning parameters
        $updateRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/control-plane/crawler-tuning', [
                'simhash_hamming_cutoff' => 6,
                'vector_cosine_cutoff' => 0.68,
                'scrape_interval_minutes' => 45,
                'freshness_window_hours' => 96,
                'max_articles_per_cluster' => 15,
                'auto_publish_threshold' => 0.90,
                'discovery_enabled' => true,
            ]);

        $updateRes->assertStatus(200);
        $updateRes->assertJsonPath('data.simhash_hamming_cutoff', 6);
        $updateRes->assertJsonPath('data.vector_cosine_cutoff', 0.68);
        $updateRes->assertJsonPath('data.scrape_interval_minutes', 45);

        $this->assertDatabaseHas('system_settings', [
            'key' => 'simhash_hamming_cutoff',
            'value' => '6',
        ]);
    }
}

