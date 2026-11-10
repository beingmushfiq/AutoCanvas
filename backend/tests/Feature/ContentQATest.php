<?php

namespace Tests\Feature;

use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentQATest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_qa_service_flags_prohibited_subjects_and_evaluates_scores(): void
    {
        $reg = $this->postJson('/api/v1/auth/register', [
            'name' => 'Compliance Officer',
            'email' => 'compliance@brand.com',
            'password' => 'secret123',
            'organization_name' => 'Fintech Corp',
        ]);
        $token = $reg->json('data.token');
        $wsId = $reg->json('data.workspace.id');

        $brandId = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson('/api/v1/brands', [
            'name' => 'FinSecure',
            'industry' => 'WealthTech',
        ])->json('data.id');

        // Set prohibited subjects on brand profile
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->putJson("/api/v1/brands/{$brandId}/profile", [
            'prohibited_subjects' => ['Guaranteed 100% returns', 'Cryptocurrency speculation'],
        ])->assertStatus(200);

        // 1. Create compliant draft post
        $itemRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/content", [
            'title' => 'Automated Portfolio Rebalancing',
            'concept' => 'Explain algorithmic index portfolio diversification for family offices.',
        ]);

        $itemRes->assertStatus(201);
        $itemId = $itemRes->json('data.id');

        // Re-evaluate QA -> Should be low risk
        $evalRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/content/{$itemId}/qa-evaluate");

        $evalRes->assertStatus(200)
            ->assertJsonPath('data.risk_level', 'low');
        $this->assertGreaterThan(70, $evalRes->json('data.overall_quality_score'));

        // 2. Update post concept with a PROHIBITED subject
        $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->putJson("/api/v1/brands/{$brandId}/content/{$itemId}", [
            'concept' => 'We offer guaranteed 100% returns on our new high-yield asset strategy!',
        ])->assertStatus(200);

        // Re-evaluate QA -> Should be flagged as HIGH risk with safety violation
        $evalViolatedRes = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Workspace-Id' => $wsId,
        ])->postJson("/api/v1/brands/{$brandId}/content/{$itemId}/qa-evaluate");

        $evalViolatedRes->assertStatus(200)
            ->assertJsonPath('data.risk_level', 'high')
            ->assertJsonPath('data.qa_report.safety_checks.contains_prohibited_terms', true);
    }
}
