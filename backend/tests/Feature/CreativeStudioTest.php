<?php

namespace Tests\Feature;

use App\AI\Gateway\AIGateway;
use App\Models\User;
use App\Modules\Brand\Models\Brand;
use App\Modules\Brand\Models\BrandProfile;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentProduction\Services\ContentQAService;
use App\Modules\ContentStrategy\Models\ContentPillar;
use App\Modules\Creative\Models\CreativeDocument;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Database\Seeders\ControlPlaneSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CreativeStudioTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $orgA;
    protected Workspace $workspaceA;
    protected User $userA;
    protected string $tokenA;
    protected Brand $brandA;

    protected Organization $orgB;
    protected Workspace $workspaceB;
    protected User $userB;
    protected string $tokenB;
    protected Brand $brandB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        $this->seed(RbacSeeder::class);
        $this->seed(ControlPlaneSeeder::class);
        Storage::fake('public');

        // Setup Tenant A
        $this->orgA = Organization::create([
            'name' => 'Studio Org A',
            'slug' => 'studio-org-a',
            'billing_email' => 'admin@orga.com',
        ]);
        $this->workspaceA = Workspace::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Studio Workspace A',
            'slug' => 'workspace-a',
        ]);
        $this->userA = User::create([
            'name' => 'Alice Designer',
            'email' => 'alice@orga.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $this->orgA->id,
            'current_workspace_id' => $this->workspaceA->id,
            'status' => 'active',
        ]);
        OrganizationMember::create([
            'organization_id' => $this->orgA->id,
            'user_id' => $this->userA->id,
            'role' => 'owner',
        ]);
        WorkspaceMember::create([
            'workspace_id' => $this->workspaceA->id,
            'user_id' => $this->userA->id,
            'role' => 'admin',
        ]);
        $this->userA->assignRole('org_owner', $this->orgA->id);
        $this->tokenA = $this->userA->createToken('token_a')->plainTextToken;
        $this->brandA = Brand::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Brand Alpha',
            'slug' => 'brand-alpha',
            'status' => 'active',
        ]);

        // Setup Tenant B
        $this->orgB = Organization::create([
            'name' => 'Studio Org B',
            'slug' => 'studio-org-b',
            'billing_email' => 'admin@orgb.com',
        ]);
        $this->workspaceB = Workspace::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Studio Workspace B',
            'slug' => 'workspace-b',
        ]);
        $this->userB = User::create([
            'name' => 'Bob Competitor',
            'email' => 'bob@orgb.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $this->orgB->id,
            'current_workspace_id' => $this->workspaceB->id,
            'status' => 'active',
        ]);
        OrganizationMember::create([
            'organization_id' => $this->orgB->id,
            'user_id' => $this->userB->id,
            'role' => 'owner',
        ]);
        WorkspaceMember::create([
            'workspace_id' => $this->workspaceB->id,
            'user_id' => $this->userB->id,
            'role' => 'admin',
        ]);
        $this->userB->assignRole('org_owner', $this->orgB->id);
        $this->tokenB = $this->userB->createToken('token_b')->plainTextToken;
        $this->brandB = Brand::create([
            'organization_id' => $this->orgB->id,
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Brand Beta',
            'slug' => 'brand-beta',
            'status' => 'active',
        ]);
    }

    public function test_can_create_list_and_update_creative_documents(): void
    {
        // 1. Create Creative Document
        $createRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/brands/{$this->brandA->id}/creatives", [
            'name' => 'Product Launch Graphic',
            'template_id' => 'minimal_corporate_v1',
            'aspect_ratio' => '1:1',
            'width' => 1080,
            'height' => 1080,
            'layers' => [
                [
                    'id' => 'layer-1',
                    'type' => 'text',
                    'text' => 'Next-Gen Autonomous Workflow',
                    'fontSize' => 48,
                    'fill' => '#FFFFFF',
                    'x' => 80,
                    'y' => 100,
                ],
                [
                    'id' => 'layer-2',
                    'type' => 'rect',
                    'width' => 920,
                    'height' => 4,
                    'fill' => '#6366F1',
                    'x' => 80,
                    'y' => 170,
                ],
            ],
            'background_config' => [
                'color' => '#0F172A',
            ],
        ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Product Launch Graphic')
            ->assertJsonPath('data.aspect_ratio', '1:1')
            ->assertJsonPath('data.render_status', 'draft');

        $docId = $createRes->json('data.id');
        $this->assertNotEmpty($docId);

        // 2. List Creative Documents for Brand
        $listRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandA->id}/creatives");

        $listRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $docId);

        // 3. Show Single Document
        $showRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/creatives/{$docId}");

        $showRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $docId)
            ->assertJsonPath('data.width', 1080);

        // 4. Update Document
        $updateRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->putJson("/api/v1/creatives/{$docId}", [
            'name' => 'Product Launch Graphic - Final',
            'aspect_ratio' => '16:9',
            'width' => 1200,
            'height' => 675,
            'layers' => [
                [
                    'id' => 'layer-1',
                    'type' => 'text',
                    'text' => 'Updated Launch Headline',
                    'fontSize' => 52,
                    'fill' => '#FFFFFF',
                    'x' => 90,
                    'y' => 110,
                ],
            ],
        ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Product Launch Graphic - Final')
            ->assertJsonPath('data.aspect_ratio', '16:9')
            ->assertJsonPath('data.width', 1200);

        // 5. Delete Document
        $deleteRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->deleteJson("/api/v1/creatives/{$docId}");

        $deleteRes->assertStatus(200)
            ->assertJsonPath('success', true);

        // Assert soft deleted
        $this->assertSoftDeleted('creative_documents', ['id' => $docId]);
    }

    public function test_cross_tenant_isolation_on_creative_documents(): void
    {
        // Tenant A creates Doc A
        $docA = CreativeDocument::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Confidential Graphic A',
            'layers' => [['id' => 'l1', 'type' => 'text', 'text' => 'Secret A']],
            'render_status' => 'draft',
        ]);

        // Tenant B attempts to read Doc A (scoped to Tenant B, record not found)
        $showRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenB}",
            'X-Workspace-Id' => $this->workspaceB->id,
        ])->getJson("/api/v1/creatives/{$docA->id}");

        $showRes->assertStatus(404);

        // Tenant B attempts to update Doc A
        $updateRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenB}",
            'X-Workspace-Id' => $this->workspaceB->id,
        ])->putJson("/api/v1/creatives/{$docA->id}", [
            'name' => 'Hijacked Graphic',
        ]);

        $updateRes->assertStatus(404);

        // Tenant B attempts to delete Doc A
        $delRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenB}",
            'X-Workspace-Id' => $this->workspaceB->id,
        ])->deleteJson("/api/v1/creatives/{$docA->id}");

        $delRes->assertStatus(404);
    }

    public function test_server_render_document_with_fallback_produces_valid_image(): void
    {
        $doc = CreativeDocument::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Editorial Banner',
            'template_id' => 'minimal_corporate_v1',
            'width' => 1200,
            'height' => 630,
            'layers' => [
                [
                    'id' => 'headline-1',
                    'type' => 'text',
                    'text' => 'Deterministic Creative Generation',
                    'fontSize' => 44,
                    'fill' => '#FFFFFF',
                    'x' => 80,
                    'y' => 120,
                ],
            ],
            'render_status' => 'draft',
        ]);

        // Render document
        $renderRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/creatives/{$doc->id}/render");

        $renderRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.render_status', 'rendered');

        $previewUrl = $renderRes->json('data.rendered_asset_url');
        $this->assertNotEmpty($previewUrl);

        $docRefreshed = CreativeDocument::find($doc->id);
        $this->assertEquals('rendered', $docRefreshed->render_status);
        $this->assertNotNull($docRefreshed->rendered_asset_url);
    }

    public function test_content_pillar_balance_computes_under_representation(): void
    {
        // Pillar A: Thought Leadership (Target 60%)
        $pillarA = ContentPillar::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Thought Leadership',
            'slug' => 'thought-leadership',
            'weight_percentage' => 60,
        ]);

        // Pillar B: Company Culture (Target 40%)
        $pillarB = ContentPillar::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Company Culture',
            'slug' => 'company-culture',
            'weight_percentage' => 40,
        ]);

        // Create 3 content items under Pillar A
        for ($i = 1; $i <= 3; $i++) {
            ContentItem::create([
                'organization_id' => $this->orgA->id,
                'workspace_id' => $this->workspaceA->id,
                'brand_id' => $this->brandA->id,
                'content_pillar_id' => $pillarA->id,
                'title' => "Article #{$i} on Industry Trends",
                'concept' => "Article #{$i} on Industry Trends",
                'status' => 'published',
            ]);
        }

        // Query pillar balance endpoint
        $balanceRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandA->id}/pillars/balance");

        $balanceRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_posts', 3);

        $pillars = collect($balanceRes->json('data.pillars'));
        $balanceA = $pillars->firstWhere('id', $pillarA->id);
        $balanceB = $pillars->firstWhere('id', $pillarB->id);

        $this->assertNotNull($balanceA);
        $this->assertNotNull($balanceB);

        // Pillar A has 3/3 = 100% actual vs 60% target -> Over-represented
        $this->assertEquals(100.0, $balanceA['actual_percentage']);
        $this->assertEquals('over_represented', $balanceA['status']);

        // Pillar B has 0/3 = 0% actual vs 40% target -> Under-represented!
        $this->assertEquals(0.0, $balanceB['actual_percentage']);
        $this->assertEquals('under_represented', $balanceB['status']);
        $this->assertEquals(-40.0, $balanceB['gap']);

        // Recommended pillar should be Pillar B (Culture)
        $this->assertEquals($pillarB->id, $balanceRes->json('data.recommended_pillar.id'));
    }

    public function test_content_generation_auto_selects_under_represented_pillar(): void
    {
        $pillarPopulated = ContentPillar::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Over-Indexed Pillar',
            'slug' => 'over-indexed-pillar',
            'weight_percentage' => 50,
        ]);

        $pillarDeficient = ContentPillar::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'name' => 'Under-Indexed Pillar',
            'slug' => 'under-indexed-pillar',
            'weight_percentage' => 50,
        ]);

        // Populate 4 posts in $pillarPopulated
        for ($i = 0; $i < 4; $i++) {
            ContentItem::create([
                'organization_id' => $this->orgA->id,
                'workspace_id' => $this->workspaceA->id,
                'brand_id' => $this->brandA->id,
                'content_pillar_id' => $pillarPopulated->id,
                'title' => "Old post #{$i}",
                'concept' => "Old post #{$i}",
                'status' => 'published',
            ]);
        }

        // Generate content WITHOUT specifying content_pillar_id
        $genRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/brands/{$this->brandA->id}/content/generate", [
            'topic' => 'Automated Campaign Focus',
            'platforms' => ['linkedin'],
            'generate_creative' => true,
        ]);

        $genRes->assertStatus(201)
            ->assertJsonPath('success', true);

        // Should automatically choose the deficient pillar
        $this->assertEquals($pillarDeficient->id, $genRes->json('data.content_pillar_id'));

        // Should also have generated a CreativeDocument
        $this->assertDatabaseHas('creative_documents', [
            'brand_id' => $this->brandA->id,
            'organization_id' => $this->orgA->id,
        ]);
    }

    public function test_content_qa_service_flags_prohibited_terms(): void
    {
        $brand = Brand::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Compliant Corp',
            'slug' => 'compliant-corp',
            'status' => 'active',
        ]);

        BrandProfile::create([
            'organization_id' => $this->orgA->id,
            'brand_id' => $brand->id,
            'mission' => 'Ethical AI',
            'prohibited_subjects' => ['guaranteed 100x return', 'unauthorized cryptocurrency'],
        ]);

        $brand->load('profile');

        $qaService = app(ContentQAService::class);

        // Test with prohibited subject
        $variantsWithProhibited = [
            'linkedin' => [
                'caption' => 'Invest now for a guaranteed 100x return on your investment portfolio!',
            ],
        ];

        $qaResult = $qaService->evaluateContent($brand, $variantsWithProhibited, 'Guaranteed ROI promotion');

        $this->assertEquals('high', $qaResult['risk_level']);
        $this->assertTrue($qaResult['safety_checks']['contains_prohibited_terms']);
        $this->assertLessThanOrEqual(50, $qaResult['overall_quality_score']);

        // Test without prohibited subject
        $cleanVariants = [
            'linkedin' => [
                'caption' => 'Discover modern infrastructure patterns designed for cloud resiliency and scale.',
            ],
        ];

        $cleanResult = $qaService->evaluateContent($brand, $cleanVariants, 'Cloud architecture whitepaper');

        $this->assertEquals('low', $cleanResult['risk_level']);
        $this->assertFalse($cleanResult['safety_checks']['contains_prohibited_terms']);
        $this->assertGreaterThanOrEqual(80, $cleanResult['overall_quality_score']);
    }
}
