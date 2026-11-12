<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Brand\Models\Brand;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\SocialConnectors\Connectors\FacebookConnector;
use App\Modules\SocialConnectors\Connectors\InstagramConnector;
use App\Modules\SocialConnectors\Connectors\LinkedInConnector;
use App\Modules\SocialConnectors\Models\SocialAccount;
use App\Modules\SocialConnectors\Services\OAuthManager;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Carbon\Carbon;
use Database\Seeders\ControlPlaneSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SocialConnectorTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected string $adminToken;

    protected Organization $orgA;
    protected Workspace $workspaceA;
    protected Brand $brandA;
    protected User $userA;
    protected string $tokenA;

    protected Organization $orgB;
    protected Workspace $workspaceB;
    protected Brand $brandB;
    protected User $userB;
    protected string $tokenB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        $this->seed(RbacSeeder::class);
        $this->seed(ControlPlaneSeeder::class);

        // Superadmin
        $this->superAdmin = User::create([
            'name' => 'Platform Admin',
            'email' => 'admin@autocanvas.io',
            'password' => bcrypt('password123'),
            'is_platform_admin' => true,
            'status' => 'active',
        ]);
        $this->superAdmin->assignRole('superadmin');
        $this->adminToken = $this->superAdmin->createToken('admin_token')->plainTextToken;

        // Tenant Org A
        $this->orgA = Organization::create([
            'name' => 'Acme Global',
            'slug' => 'acme-global',
            'billing_email' => 'billing@acme.com',
            'status' => 'active',
        ]);
        $this->workspaceA = Workspace::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Acme Primary',
            'slug' => 'acme-primary',
            'is_default' => true,
        ]);
        $this->brandA = Brand::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Acme Brand',
            'slug' => 'acme-brand',
            'status' => 'active',
        ]);
        $this->userA = User::create([
            'name' => 'Alice Admin',
            'email' => 'alice@acme.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $this->orgA->id,
            'current_workspace_id' => $this->workspaceA->id,
            'is_platform_admin' => false,
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

        // Tenant Org B
        $this->orgB = Organization::create([
            'name' => 'Beta Corp',
            'slug' => 'beta-corp',
            'billing_email' => 'billing@beta.com',
            'status' => 'active',
        ]);
        $this->workspaceB = Workspace::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Beta Primary',
            'slug' => 'beta-primary',
            'is_default' => true,
        ]);
        $this->brandB = Brand::create([
            'organization_id' => $this->orgB->id,
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Beta Brand',
            'slug' => 'beta-brand',
            'status' => 'active',
        ]);
        $this->userB = User::create([
            'name' => 'Bob Beta',
            'email' => 'bob@beta.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $this->orgB->id,
            'current_workspace_id' => $this->workspaceB->id,
            'is_platform_admin' => false,
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
    }

    public function test_oauth_state_generation_and_tamper_rejection(): void
    {
        $manager = new OAuthManager();
        $state = $manager->generateState($this->orgA->id, $this->workspaceA->id, $this->brandA->id, 'facebook');

        $this->assertNotEmpty($state);
        $this->assertStringContainsString('.', $state);

        // 1. Verify valid state parses correctly
        $data = $manager->verifyState($state);
        $this->assertNotNull($data);
        $this->assertEquals($this->orgA->id, $data['org_id']);
        $this->assertEquals('facebook', $data['platform']);

        // 2. Tampered state must be rejected
        $tamperedState = substr($state, 0, -4) . 'fake';
        $this->assertNull($manager->verifyState($tamperedState));

        // 3. Expired state must be rejected
        $expiredPayload = [
            'org_id' => $this->orgA->id,
            'platform' => 'facebook',
            'ts' => time() - 1000, // > 900s
            'nonce' => 'test1234',
        ];
        $encoded = rtrim(strtr(base64_encode(json_encode($expiredPayload)), '+/', '-_'), '=');
        $sig = hash_hmac('sha256', $encoded, config('app.key'));
        $expiredState = "{$encoded}.{$sig}";

        $this->assertNull($manager->verifyState($expiredState));
    }

    public function test_database_encryption_at_rest_for_oauth_tokens(): void
    {
        $rawSecret = 'super_confidential_access_token_xyz_987';
        $rawRefresh = 'super_confidential_refresh_token_abc_123';

        $account = SocialAccount::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'platform' => 'facebook',
            'provider_id' => 'page_123456',
            'account_name' => 'Acme Facebook Page',
            'account_type' => 'page',
            'access_token' => $rawSecret,
            'refresh_token' => $rawRefresh,
            'expires_at' => Carbon::now()->addDays(60),
            'connection_status' => 'connected',
            'is_active' => true,
        ]);

        // Model attribute decryption works seamlessly
        $this->assertEquals($rawSecret, $account->access_token);
        $this->assertEquals($rawRefresh, $account->refresh_token);

        // Direct raw SQLite/MySQL query confirms data is NOT stored as plaintext
        $rawRecord = DB::table('social_accounts')->where('id', $account->id)->first();
        $this->assertNotNull($rawRecord);
        $this->assertStringNotContainsString($rawSecret, $rawRecord->access_token);
        $this->assertStringNotContainsString($rawRefresh, $rawRecord->refresh_token);
    }

    public function test_facebook_connector_oauth_and_publishing_with_faked_http(): void
    {
        Http::fake([
            // 1. Short-lived token exchange
            'https://graph.facebook.com/v21.0/oauth/access_token*grant_type=fb_exchange_token*' => Http::response([
                'access_token' => 'long_lived_user_token_777',
                'expires_in' => 5184000,
            ]),
            'https://graph.facebook.com/v21.0/oauth/access_token*' => Http::response([
                'access_token' => 'short_lived_user_token_111',
            ]),
            // 2. Fetch pages
            'https://graph.facebook.com/v21.0/me/accounts*' => Http::response([
                'data' => [
                    [
                        'id' => 'fb_page_555',
                        'name' => 'Acme Coffee Official',
                        'access_token' => 'permanent_page_access_token_999',
                        'category' => 'Retail',
                        'picture' => ['data' => ['url' => 'https://cdn.example.com/fb_avatar.png']],
                    ],
                ],
            ]),
            // 3. Publish text post to feed
            'https://graph.facebook.com/v21.0/fb_page_555/feed' => Http::response([
                'id' => 'fb_page_555_post_001',
            ], 200),
            // 4. Publish photo
            'https://graph.facebook.com/v21.0/fb_page_555/photos' => Http::response([
                'id' => 'fb_page_555_photo_002',
                'post_id' => 'fb_page_555_photo_002',
            ], 200),
        ]);

        $connector = new FacebookConnector();

        // Test token exchange
        $tokens = $connector->exchangeCodeForTokens('sample_auth_code', 'http://localhost/callback');
        $this->assertEquals('fb_page_555', $tokens['provider_id']);
        $this->assertEquals('permanent_page_access_token_999', $tokens['access_token']);
        $this->assertEquals('Acme Coffee Official', $tokens['account_name']);

        // Test text publish
        $publishRes = $connector->publish([
            'text' => 'Hello Facebook from AutoCanvas autonomous engine!',
        ], [
            'access_token' => $tokens['access_token'],
            'provider_id' => $tokens['provider_id'],
        ]);

        $this->assertEquals('success', $publishRes['status']);
        $this->assertEquals('fb_page_555_post_001', $publishRes['id']);

        // Test photo publish
        $photoRes = $connector->publish([
            'text' => 'Check our new product',
            'image_url' => 'https://cdn.example.com/product.png',
        ], [
            'access_token' => $tokens['access_token'],
            'provider_id' => $tokens['provider_id'],
        ]);

        $this->assertEquals('success', $photoRes['status']);
        $this->assertEquals('fb_page_555_photo_002', $photoRes['id']);
    }

    public function test_instagram_connector_containerized_publishing_flow(): void
    {
        Http::fake([
            // Step 1: Create media container
            'https://graph.facebook.com/v21.0/ig_user_444/media' => Http::response([
                'id' => 'ig_container_9999',
            ], 200),
            // Step 2: Poll container status
            'https://graph.facebook.com/v21.0/ig_container_9999*' => Http::response([
                'id' => 'ig_container_9999',
                'status_code' => 'FINISHED',
            ], 200),
            // Step 3: Publish container
            'https://graph.facebook.com/v21.0/ig_user_444/media_publish' => Http::response([
                'id' => 'ig_media_post_8888',
            ], 200),
        ]);

        $connector = new InstagramConnector();
        $result = $connector->publish([
            'caption' => 'Morning espresso inspiration #coffee #morning',
            'image_url' => 'https://cdn.example.com/espresso.jpg',
        ], [
            'access_token' => 'mock_ig_token',
            'provider_id' => 'ig_user_444',
        ]);

        $this->assertEquals('success', $result['status']);
        $this->assertEquals('instagram', $result['platform']);
        $this->assertEquals('ig_media_post_8888', $result['id']);
        $this->assertStringContainsString('instagram.com/p/ig_media_post_8888', $result['url']);
    }

    public function test_linkedin_connector_oauth_and_ugc_publishing(): void
    {
        Http::fake([
            // 1. Code exchange
            'https://www.linkedin.com/oauth/v2/accessToken' => Http::response([
                'access_token' => 'li_access_token_333',
                'expires_in' => 5184000,
                'refresh_token' => 'li_refresh_token_444',
            ], 200),
            // 2. User info
            'https://api.linkedin.com/v2/userinfo' => Http::response([
                'sub' => 'member_777',
                'name' => 'Alice Marketer',
                'email' => 'alice@acme.com',
                'picture' => 'https://media.licdn.com/avatar.jpg',
            ], 200),
            // 3. Publish UGC post
            'https://api.linkedin.com/v2/ugcPosts' => Http::response([
                'id' => 'urn:li:share:99887766',
            ], 201, ['x-restli-id' => 'urn:li:share:99887766']),
        ]);

        $connector = new LinkedInConnector();

        $tokenData = $connector->exchangeCodeForTokens('sample_li_code', 'http://localhost/callback');
        $this->assertEquals('li_access_token_333', $tokenData['access_token']);
        $this->assertEquals('Alice Marketer', $tokenData['account_name']);
        $this->assertEquals('member_777', $tokenData['provider_id']);

        $pubRes = $connector->publish([
            'text' => 'Proud to announce our Q4 sustainability milestones at Acme Global.',
        ], [
            'access_token' => $tokenData['access_token'],
            'provider_id' => $tokenData['provider_id'],
            'metadata' => $tokenData['metadata'],
        ]);

        $this->assertEquals('success', $pubRes['status']);
        $this->assertEquals('urn:li:share:99887766', $pubRes['id']);
        $this->assertStringContainsString('urn:li:share:99887766', $pubRes['url']);
    }

    public function test_token_monitor_command_refreshes_expiring_tokens(): void
    {
        // Create account expiring in 3 days with refresh token
        $account = SocialAccount::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'platform' => 'linkedin',
            'provider_id' => 'li_mem_123',
            'account_name' => 'Alice LinkedIn',
            'access_token' => 'old_access_token',
            'refresh_token' => 'valid_refresh_token',
            'expires_at' => Carbon::now()->addDays(3),
            'connection_status' => 'connected',
            'is_active' => true,
        ]);

        Http::fake([
            'https://www.linkedin.com/oauth/v2/accessToken' => Http::response([
                'access_token' => 'renewed_access_token_888',
                'refresh_token' => 'valid_refresh_token',
                'expires_in' => 5184000,
            ], 200),
        ]);

        $this->artisan('social:check-tokens', ['--days' => 7])
            ->assertSuccessful();

        $account->refresh();
        $this->assertEquals('renewed_access_token_888', $account->access_token);
        $this->assertTrue($account->expires_at->gt(Carbon::now()->addDays(30)));
    }

    public function test_cross_tenant_user_cannot_access_or_modify_other_tenant_social_account(): void
    {
        // Account belongs to Org A
        $accountA = SocialAccount::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'platform' => 'facebook',
            'provider_id' => 'page_org_a',
            'account_name' => 'Org A Page',
            'access_token' => 'token_org_a',
            'connection_status' => 'connected',
            'is_active' => true,
        ]);

        // User B (Org B) cannot disconnect Org A's social account (scoped to Org B, so returns 404)
        $delRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenB}",
        ])->deleteJson("/api/v1/social/connectors/{$accountA->id}");

        $delRes->assertStatus(404);

        // User B cannot refresh Org A's token
        $refRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenB}",
        ])->postJson("/api/v1/social/connectors/{$accountA->id}/refresh");

        $refRes->assertStatus(404);
    }

    public function test_tenant_user_can_view_and_disconnect_own_social_account(): void
    {
        $accountA = SocialAccount::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'platform' => 'facebook',
            'provider_id' => 'page_org_a_2',
            'account_name' => 'Org A Page 2',
            'access_token' => 'token_org_a_2',
            'connection_status' => 'connected',
            'is_active' => true,
        ]);

        $listRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
        ])->getJson('/api/v1/social/connectors');

        $listRes->assertStatus(200)
            ->assertJsonPath('data.0.id', $accountA->id)
            ->assertJsonMissing(['access_token']); // Token MUST NOT leak in JSON

        $delSuccess = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
        ])->deleteJson("/api/v1/social/connectors/{$accountA->id}");

        $delSuccess->assertStatus(200);
        $this->assertDatabaseMissing('social_accounts', ['id' => $accountA->id]);
    }

    public function test_non_admin_cannot_access_control_plane_social_endpoints(): void
    {
        $forbiddenRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
        ])->getJson('/api/v1/control-plane/social/apps');

        $forbiddenRes->assertStatus(403);
    }

    public function test_control_plane_social_app_config_and_telemetry(): void
    {
        // 1. Superadmin updates social app credentials
        $updateRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->putJson('/api/v1/control-plane/social/apps', [
            'meta_app_id' => '123456789012345',
            'meta_app_secret' => 'super_secret_meta_key_456',
            'linkedin_client_id' => '78abcd987654',
            'linkedin_client_secret' => 'super_secret_linkedin_key_123',
        ]);

        $updateRes->assertStatus(200)
            ->assertJson(['success' => true]);

        // 2. Superadmin inspects masked credentials
        $viewRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->getJson('/api/v1/control-plane/social/apps');

        $viewRes->assertStatus(200)
            ->assertJsonPath('data.meta.app_id', '1234***')
            ->assertJsonPath('data.meta.app_secret_configured', true);

        // 3. Superadmin inspects platform-wide accounts
        $accountsRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->getJson('/api/v1/control-plane/social/accounts');

        $accountsRes->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'summary' => ['total', 'connected', 'expired'],
                    'accounts',
                ],
            ]);
    }

    public function test_direct_token_binding_persists_actual_account(): void
    {
        Http::fake([
            'https://graph.facebook.com/v21.0/1122334455*' => Http::response([
                'id' => '1122334455',
                'name' => 'Real Verified Brand Page',
                'category' => 'Marketing Agency',
                'picture' => [
                    'data' => [
                        'url' => 'https://cdn.example.com/page-avatar.png',
                    ],
                ],
            ], 200),
        ]);

        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->tokenA}",
        ])->postJson('/api/v1/social/connectors/bind-direct', [
            'platform' => 'facebook',
            'provider_id' => '1122334455',
            'account_name' => 'Real Verified Brand Page',
            'access_token' => 'EAA_real_page_access_token_xyz_987',
            'account_type' => 'page',
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.account_name', 'Real Verified Brand Page')
            ->assertJsonPath('data.provider_id', '1122334455');

        $account = SocialAccount::where('organization_id', $this->orgA->id)
            ->where('provider_id', '1122334455')
            ->first();

        $this->assertNotNull($account);
        $this->assertEquals('facebook', $account->platform);
        $this->assertEquals('connected', $account->connection_status);
        $this->assertEquals('EAA_real_page_access_token_xyz_987', $account->access_token);
        $this->assertEquals('direct_token', $account->metadata['binding_method']);
    }
}
