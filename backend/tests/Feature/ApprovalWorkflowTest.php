<?php

namespace Tests\Feature;

use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_approval_lifecycle_transitions_and_audit_logging(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Managing Editor',
            'email' => 'editor@press.com',
            'password' => 'secret123',
            'organization_name' => 'Press Group',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');
        $orgId = $reg->json('data.organization.id');

        $brandId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', ['name' => 'Global News Daily'])->json('data.id');

        // Create initial draft
        $draftRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/content", [
            'title' => 'Breaking Industry Report',
            'concept' => 'Q4 Market synthesis and executive survey data.',
        ]);

        $itemId = $draftRes->json('data.id');
        $this->assertEquals('draft', $draftRes->json('data.status'));

        // 1. Submit for Review
        $reviewRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/content/{$itemId}/submit-review");

        $reviewRes->assertStatus(200)
            ->assertJsonPath('data.status', 'review');

        // 2. Reject with feedback
        $rejectRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/content/{$itemId}/reject", [
            'feedback' => 'Please add more emphasis on regional data for APAC.',
        ]);

        $rejectRes->assertStatus(200)
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.review_feedback', 'Please add more emphasis on regional data for APAC.');

        // 3. Re-submit for Review
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/content/{$itemId}/submit-review")
            ->assertStatus(200);

        // 4. Approve
        $approveRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/content/{$itemId}/approve");

        $approveRes->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');
        $this->assertNotNull($approveRes->json('data.reviewed_at'));

        // 5. Verify audit log entry
        $this->assertDatabaseHas('audit_logs', [
            'organization_id' => $orgId,
            'action' => 'content.approved',
        ]);
    }
}
