<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Billing\Models\Plan;
use App\Modules\Organization\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SovereignControlPlaneAndTenantTest extends TestCase
{
    use RefreshDatabase;

    protected User $superadmin;
    protected User $regularUser;
    protected Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Platform Admin
        $this->superadmin = User::factory()->create([
            'email' => 'superadmin@autocanvas.com',
            'is_platform_admin' => true,
        ]);

        // 2. Create Regular User
        $this->regularUser = User::factory()->create([
            'email' => 'regular@client.com',
            'is_platform_admin' => false,
        ]);

        // 3. Create Sample Plan
        $this->plan = Plan::create([
            'name' => 'Agency Pro',
            'slug' => 'agency-pro',
            'price_monthly' => 199.00,
            'price_yearly' => 1990.00,
            'features' => ['max_brands' => 10, 'max_members' => 20],
            'is_active' => true,
        ]);
    }

    public function test_unauthenticated_request_to_control_plane_returns_401(): void
    {
        $response = $this->getJson('/api/v1/control-plane/organizations');
        $response->assertStatus(401);
    }

    public function test_non_platform_admin_request_returns_403(): void
    {
        $response = $this->actingAs($this->regularUser)
            ->getJson('/api/v1/control-plane/organizations');

        $response->assertStatus(403);
    }

    public function test_platform_admin_can_list_plans(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->getJson('/api/v1/control-plane/organizations/plans');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.slug', 'agency-pro');
    }

    public function test_platform_admin_can_register_new_tenant_with_owner_and_workspace(): void
    {
        $payload = [
            'name' => 'CyberPulse Agency',
            'slug' => 'cyberpulse-agency',
            'billing_email' => 'billing@cyberpulse.com',
            'timezone' => 'America/New_York',
            'plan_id' => $this->plan->id,
            'owner_name' => 'Sarah Connor',
            'owner_email' => 'sarah@cyberpulse.com',
            'owner_password' => 'SecurePass123!@#',
        ];

        $response = $this->actingAs($this->superadmin)
            ->postJson('/api/v1/control-plane/organizations', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.organization.name', 'CyberPulse Agency')
            ->assertJsonPath('data.organization.slug', 'cyberpulse-agency')
            ->assertJsonPath('data.owner.email', 'sarah@cyberpulse.com')
            ->assertJsonPath('data.workspace.name', 'Default Workspace');

        $this->assertDatabaseHas('organizations', [
            'name' => 'CyberPulse Agency',
            'slug' => 'cyberpulse-agency',
            'billing_email' => 'billing@cyberpulse.com',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'sarah@cyberpulse.com',
        ]);

        $this->assertDatabaseHas('workspaces', [
            'name' => 'Default Workspace',
            'is_default' => true,
        ]);
    }

    public function test_platform_admin_can_update_and_suspend_tenant(): void
    {
        // First register
        $org = Organization::create([
            'name' => 'Starlight Media',
            'slug' => 'starlight-media',
            'billing_email' => 'ops@starlight.com',
            'status' => 'active',
        ]);

        // Update name
        $updateResp = $this->actingAs($this->superadmin)
            ->putJson("/api/v1/control-plane/organizations/{$org->id}", [
                'name' => 'Starlight Media Global',
            ]);

        $updateResp->assertStatus(200)
            ->assertJsonPath('data.name', 'Starlight Media Global');

        // Suspend
        $suspendResp = $this->actingAs($this->superadmin)
            ->putJson("/api/v1/control-plane/organizations/{$org->id}/status", [
                'status' => 'suspended',
                'reason' => 'Payment terms violation',
            ]);

        $suspendResp->assertStatus(200)
            ->assertJsonPath('data.status', 'suspended');

        $this->assertDatabaseHas('organizations', [
            'id' => $org->id,
            'status' => 'suspended',
        ]);
    }

    public function test_platform_admin_can_upload_and_sanitize_svg_asset(): void
    {
        Storage::fake('public');

        $maliciousSvg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" onload="alert('XSS')">
  <circle cx="50" cy="50" r="40" fill="red" />
  <script>evilCode()</script>
</svg>
SVG;

        $file = UploadedFile::fake()->createWithContent('malicious-logo.svg', $maliciousSvg);

        $response = $this->actingAs($this->superadmin)
            ->postJson('/api/v1/control-plane/cms/assets/upload', [
                'file' => $file,
                'asset_type' => 'primary_logo',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $savedPath = $response->json('data.path');
        $storedContent = Storage::disk('public')->get($savedPath);

        // Assert SVG scripts and onload triggers were sanitized away
        $this->assertStringNotContainsString('<script>', $storedContent);
        $this->assertStringNotContainsString('onload', $storedContent);
        $this->assertStringContainsString('<circle', $storedContent);
    }
}

