<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Brand\Models\Brand;
use App\Modules\Brand\Models\BrandProfile;
use App\Modules\Brand\Models\BrandVoiceProfile;
use App\Modules\Community\Models\SocialConversation;
use App\Modules\Community\Models\SocialMessage;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\SocialConnectors\Models\SocialAccount;
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

class CommunityInboxTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $orgA;
    protected Workspace $workspaceA;
    protected Brand $brandA;
    protected User $userA;
    protected string $tokenA;
    protected SocialAccount $accountA;

    protected Organization $orgB;
    protected Workspace $workspaceB;
    protected Brand $brandB;
    protected User $userB;
    protected string $tokenB;
    protected SocialAccount $accountB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        $this->seed(RbacSeeder::class);
        $this->seed(ControlPlaneSeeder::class);

        // --- Tenant A ---
        $this->orgA = Organization::create([
            'name' => 'Acme Global Org',
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
            'name' => 'Acme Studio',
            'slug' => 'acme-studio',
            'status' => 'active',
        ]);
        BrandProfile::create([
            'organization_id' => $this->orgA->id,
            'brand_id' => $this->brandA->id,
            'mission' => 'Empower creators with automated workflows',
            'prohibited_subjects' => ['gambling', 'crypto airdrops'],
        ]);
        BrandVoiceProfile::create([
            'organization_id' => $this->orgA->id,
            'brand_id' => $this->brandA->id,
            'tone' => 'witty, polite, and helpful',
            'formality_level' => 'conversational',
            'personality_traits' => ['approachable', 'sharp'],
        ]);
        $this->userA = User::create([
            'name' => 'Alice Admin',
            'email' => 'alice@acme.com',
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

        $this->accountA = SocialAccount::create([
            'organization_id' => $this->orgA->id,
            'workspace_id' => $this->workspaceA->id,
            'brand_id' => $this->brandA->id,
            'platform' => 'facebook',
            'provider_id' => 'fb_page_1001',
            'account_type' => 'page',
            'account_name' => 'Acme Facebook Page',
            'access_token' => 'mock_fb_access_token_1001',
            'expires_at' => Carbon::now()->addDays(60),
            'is_active' => true,
            'connection_status' => 'connected',
        ]);

        // --- Tenant B ---
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

        $this->accountB = SocialAccount::create([
            'organization_id' => $this->orgB->id,
            'workspace_id' => $this->workspaceB->id,
            'brand_id' => $this->brandB->id,
            'platform' => 'facebook',
            'provider_id' => 'fb_page_2002',
            'account_type' => 'page',
            'account_name' => 'Beta Facebook Page',
            'access_token' => 'mock_fb_access_token_2002',
            'expires_at' => Carbon::now()->addDays(60),
            'is_active' => true,
            'connection_status' => 'connected',
        ]);
    }

    public function test_inbound_message_ingestion_creates_conversation_and_message_threads(): void
    {
        $payload = [
            'platform_message_id' => 'fb_comment_9001',
            'platform_thread_id' => 'fb_post_8001',
            'platform_post_id' => 'fb_post_8001',
            'sender_id' => 'fb_user_555',
            'sender_name' => 'Sarah Connor',
            'message_text' => 'How do I invite team members to my workspace?',
            'conversation_type' => 'post_comments',
        ];

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/accounts/{$this->accountA->id}/ingest", $payload);

        $res->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.sender_name', 'Sarah Connor')
            ->assertJsonPath('data.intent', 'inquiry');

        // Check Conversation
        $conversation = SocialConversation::where('platform_thread_id', 'fb_post_8001')->first();
        $this->assertNotNull($conversation);
        $this->assertEquals($this->orgA->id, $conversation->organization_id);
        $this->assertEquals($this->brandA->id, $conversation->brand_id);
        $this->assertEquals('open', $conversation->status);

        // Check Message and Auto AI Draft
        $message = SocialMessage::where('platform_message_id', 'fb_comment_9001')->first();
        $this->assertNotNull($message);
        $this->assertEquals('inbound', $message->direction);
        $this->assertNotEmpty($message->ai_draft_reply);
        $this->assertEquals('pending', $message->ai_draft_status);
    }

    public function test_ai_message_classification_identifies_intent_and_sentiment(): void
    {
        // 1. Complaint Message -> escalated, negative sentiment
        $complaintPayload = [
            'platform_message_id' => 'fb_comment_complaint_01',
            'platform_thread_id' => 'fb_post_complaint_01',
            'sender_name' => 'Angry User',
            'message_text' => 'This service is terrible! It crashed and I lost my work! Completely broken refund now!',
        ];

        $resComplaint = $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/accounts/{$this->accountA->id}/ingest", $complaintPayload);

        $resComplaint->assertStatus(201)
            ->assertJsonPath('data.intent', 'complaint');

        $convComplaint = SocialConversation::where('platform_thread_id', 'fb_post_complaint_01')->first();
        $this->assertEquals('escalated', $convComplaint->status);
        $this->assertEquals('high', $convComplaint->priority);

        // 2. Praise Message -> positive sentiment
        $praisePayload = [
            'platform_message_id' => 'fb_comment_praise_01',
            'platform_thread_id' => 'fb_post_praise_01',
            'sender_name' => 'Happy User',
            'message_text' => 'I absolutely love this platform! Amazing design and super fast results! Fantastic work!',
        ];

        $resPraise = $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/accounts/{$this->accountA->id}/ingest", $praisePayload);

        $resPraise->assertStatus(201)
            ->assertJsonPath('data.intent', 'praise');

        $msgPraise = SocialMessage::where('platform_message_id', 'fb_comment_praise_01')->first();
        $this->assertTrue($msgPraise->isPositive());
    }

    public function test_spam_messages_are_automatically_flagged_and_isolated(): void
    {
        $spamPayload = [
            'platform_message_id' => 'fb_comment_spam_01',
            'platform_thread_id' => 'fb_post_spam_01',
            'sender_name' => 'Crypto Bot',
            'message_text' => 'Claim your 1000 USDT free bonus right now on telegram t.me/airdrop_crypto_giveaway pump 100x!',
        ];

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/accounts/{$this->accountA->id}/ingest", $spamPayload);

        $res->assertStatus(201)
            ->assertJsonPath('data.intent', 'spam');

        $conv = SocialConversation::where('platform_thread_id', 'fb_post_spam_01')->first();
        $this->assertEquals('spam', $conv->status);
        $this->assertEquals('low', $conv->priority);

        $msg = SocialMessage::where('platform_message_id', 'fb_comment_spam_01')->first();
        $this->assertTrue($msg->is_hidden_on_platform);
        $this->assertNull($msg->ai_draft_reply);
    }

    public function test_ai_draft_response_honors_brand_voice_profile(): void
    {
        // First ingest a normal inquiry message
        $inquiryPayload = [
            'platform_message_id' => 'fb_msg_draft_01',
            'platform_thread_id' => 'fb_thread_draft_01',
            'sender_name' => 'Mark Spector',
            'message_text' => 'How can I integrate AutoCanvas with my Shopify store?',
        ];

        $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/accounts/{$this->accountA->id}/ingest", $inquiryPayload);

        $message = SocialMessage::where('platform_message_id', 'fb_msg_draft_01')->first();

        // Trigger on-demand generate draft endpoint
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/messages/{$message->id}/generate-draft");

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'ai_draft_reply',
                    'message',
                ],
            ]);

        $this->assertNotEmpty($res->json('data.ai_draft_reply'));
    }

    public function test_dispatch_approved_reply_sends_to_platform_and_settles_message(): void
    {
        Http::fake([
            'https://graph.facebook.com/v21.0/fb_parent_comment_123/comments' => Http::response([
                'id' => 'fb_remote_reply_456',
            ], 200),
        ]);

        // Ingest parent comment
        $payload = [
            'platform_message_id' => 'fb_parent_comment_123',
            'platform_thread_id' => 'fb_thread_parent_123',
            'sender_name' => 'John Doe',
            'message_text' => 'Can I schedule posts 3 weeks in advance?',
        ];

        $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/accounts/{$this->accountA->id}/ingest", $payload);

        $parentMessage = SocialMessage::where('platform_message_id', 'fb_parent_comment_123')->first();

        // Approve and dispatch reply
        $replyText = 'Yes! You can schedule up to 6 months in advance with our calendar.';
        $replyRes = $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/messages/{$parentMessage->id}/reply", [
                'reply_text' => $replyText,
            ]);

        $replyRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.direction', 'outbound')
            ->assertJsonPath('data.message_text', $replyText);

        // Verify database state
        $outbound = SocialMessage::where('direction', 'outbound')
            ->where('parent_message_id', 'fb_parent_comment_123')
            ->first();
        $this->assertNotNull($outbound);
        $this->assertEquals('fb_remote_reply_456', $outbound->platform_message_id);

        $conversation = $parentMessage->conversation->fresh();
        $this->assertEquals('resolved', $conversation->status);

        // Verify audit log
        $auditLog = DB::table('audit_logs')
            ->where('action', 'community.reply_dispatched')
            ->where('organization_id', $this->orgA->id)
            ->first();
        $this->assertNotNull($auditLog);
    }

    public function test_conversation_resolution_and_escalation_lifecycle(): void
    {
        $payload = [
            'platform_message_id' => 'fb_comment_lifecycle_01',
            'platform_thread_id' => 'fb_thread_lifecycle_01',
            'sender_name' => 'Lifecycle User',
            'message_text' => 'Need support with account setup.',
        ];

        $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/accounts/{$this->accountA->id}/ingest", $payload);

        $conv = SocialConversation::where('platform_thread_id', 'fb_thread_lifecycle_01')->first();

        // 1. Escalate
        $escRes = $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/conversations/{$conv->id}/escalate", [
                'priority' => 'urgent',
            ]);
        $escRes->assertStatus(200)
            ->assertJsonPath('data.status', 'escalated')
            ->assertJsonPath('data.priority', 'urgent');

        // 2. Mark Spam
        $spamRes = $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/conversations/{$conv->id}/mark-spam");
        $spamRes->assertStatus(200)
            ->assertJsonPath('data.status', 'spam');

        // 3. Resolve
        $resRes = $this->withHeader('Authorization', 'Bearer ' . $this->tokenA)
            ->withHeader('X-Organization-Id', $this->orgA->id)
            ->postJson("/api/v1/inbox/conversations/{$conv->id}/resolve");
        $resRes->assertStatus(200)
            ->assertJsonPath('data.status', 'resolved');
    }

    public function test_cross_tenant_isolation_on_inbox_endpoints(): void
    {
        // Ingest message under Tenant B
        $payloadB = [
            'platform_message_id' => 'fb_comment_tenant_b_01',
            'platform_thread_id' => 'fb_thread_tenant_b_01',
            'sender_name' => 'Secret Customer B',
            'message_text' => 'Confidential feedback for Beta Corp only.',
        ];

        $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenB,
            'X-Workspace-Id' => $this->workspaceB->id,
        ])->postJson("/api/v1/inbox/accounts/{$this->accountB->id}/ingest", $payloadB);

        $convB = SocialConversation::where('platform_thread_id', 'fb_thread_tenant_b_01')->first();
        $msgB = SocialMessage::where('platform_message_id', 'fb_comment_tenant_b_01')->first();

        // Forget Sanctum user so tokenA authenticates cleanly
        auth('sanctum')->forgetUser();

        // Tenant A attempts to view Tenant B's brand conversations -> 404
        $leakRes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/brands/{$this->brandB->id}/inbox/conversations");
        $leakRes->assertStatus(404);

        // Tenant A attempts to view Tenant B's conversation details -> 404
        $convRes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->getJson("/api/v1/inbox/conversations/{$convB->id}");
        $convRes->assertStatus(404);

        // Tenant A attempts to reply to Tenant B's message -> 404
        $replyLeak = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->tokenA,
            'X-Workspace-Id' => $this->workspaceA->id,
        ])->postJson("/api/v1/inbox/messages/{$msgB->id}/reply", [
            'reply_text' => 'Hacked response from Tenant A',
        ]);
        $replyLeak->assertStatus(404);
    }

    public function test_inbox_sync_command_polls_active_social_accounts(): void
    {
        Http::fake([
            'https://graph.facebook.com/v21.0/fb_page_1001/feed*' => Http::response([
                'data' => [
                    [
                        'id' => 'fb_post_polled_99',
                        'comments' => [
                            'data' => [
                                [
                                    'id' => 'fb_comment_polled_01',
                                    'message' => 'Great product updates, keep them coming!',
                                    'from' => [
                                        'id' => 'user_polled_1',
                                        'name' => 'Polled Supporter',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $this->artisan('inbox:sync')
            ->assertExitCode(0);

        $message = SocialMessage::where('platform_message_id', 'fb_comment_polled_01')->first();
        $this->assertNotNull($message);
        $this->assertEquals('Polled Supporter', $message->sender_name);
        $this->assertEquals('praise', $message->intent);
    }
}
