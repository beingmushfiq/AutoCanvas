<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Billing\Models\Invoice;
use App\Modules\Billing\Models\PaymentTransaction;
use App\Modules\Billing\Models\Plan;
use App\Modules\Billing\Models\Subscription;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Database\Seeders\ControlPlaneSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocalBillingTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected string $adminToken;
    protected Organization $org;
    protected Workspace $workspace;
    protected User $owner;
    protected string $ownerToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        $this->seed(RbacSeeder::class);
        $this->seed(ControlPlaneSeeder::class);

        // Superadmin User
        $this->superAdmin = User::create([
            'name' => 'Platform Operator',
            'email' => 'operator@autocanvas.io',
            'password' => bcrypt('password123'),
            'is_platform_admin' => true,
            'status' => 'active',
        ]);
        $this->superAdmin->assignRole('superadmin');
        $this->adminToken = $this->superAdmin->createToken('admin_token')->plainTextToken;

        // Tenant Organization & Owner
        $this->org = Organization::create([
            'name' => 'Apex Agency',
            'slug' => 'apex-agency',
            'billing_email' => 'finance@apex.com',
            'status' => 'active',
        ]);

        $this->workspace = Workspace::create([
            'organization_id' => $this->org->id,
            'name' => 'Default Workspace',
            'slug' => 'default',
            'is_default' => true,
        ]);

        $this->owner = User::create([
            'name' => 'Alice Founder',
            'email' => 'alice@apex.com',
            'password' => bcrypt('password123'),
            'current_organization_id' => $this->org->id,
            'current_workspace_id' => $this->workspace->id,
            'is_platform_admin' => false,
            'status' => 'active',
        ]);

        OrganizationMember::create([
            'organization_id' => $this->org->id,
            'user_id' => $this->owner->id,
            'role' => 'owner',
        ]);
        WorkspaceMember::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->owner->id,
            'role' => 'owner',
        ]);
        $this->owner->assignRole('org_owner', $this->org->id);

        $this->ownerToken = $this->owner->createToken('owner_token')->plainTextToken;

        // Attach starter subscription initially
        $starterPlan = Plan::where('slug', 'starter')->firstOrFail();
        Subscription::create([
            'organization_id' => $this->org->id,
            'plan_id' => $starterPlan->id,
            'status' => 'active',
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
        ]);
    }

    public function test_tenant_can_checkout_and_receive_invoice_with_payment_instructions(): void
    {
        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson('/api/v1/billing/checkout', [
            'plan_slug' => 'growth',
            'billing_cycle' => 'monthly',
            'currency' => 'BDT',
        ]);

        $res->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'invoice' => [
                        'id',
                        'invoice_number',
                        'plan_name',
                        'billing_cycle',
                        'amount',
                        'currency',
                        'due_date',
                        'status',
                    ],
                    'instructions' => [
                        'payable_amount',
                        'currency',
                        'invoice_number',
                        'methods' => ['bkash', 'nagad', 'bank_wire'],
                    ],
                ],
                'message',
            ]);

        // 79 USD * 120 BDT = 9480 BDT
        $this->assertEquals(9480.00, $res->json('data.invoice.amount'));
        $this->assertEquals('BDT', $res->json('data.invoice.currency'));
        $this->assertEquals('unpaid', $res->json('data.invoice.status'));
    }

    public function test_tenant_can_submit_bkash_transaction_id(): void
    {
        // 1. Checkout
        $checkoutRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson('/api/v1/billing/checkout', [
            'plan_slug' => 'growth',
            'billing_cycle' => 'monthly',
            'currency' => 'BDT',
        ]);
        $invoiceId = $checkoutRes->json('data.invoice.id');

        // 2. Submit TrxID
        $submitRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson('/api/v1/billing/payments/submit-trx', [
            'invoice_id' => $invoiceId,
            'gateway' => 'bkash',
            'transaction_reference' => 'BKASH98765432',
            'sender_number' => '01711223344',
            'amount' => 9480.00,
        ]);

        $submitRes->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'gateway' => 'bkash',
                    'transaction_reference' => 'BKASH98765432',
                    'status' => 'pending',
                ],
            ]);

        // Invoice status transitions to processing
        $invoice = Invoice::findOrFail($invoiceId);
        $this->assertEquals('processing', $invoice->status);

        // Transaction recorded in pending state
        $this->assertDatabaseHas('payment_transactions', [
            'invoice_id' => $invoiceId,
            'transaction_reference' => 'BKASH98765432',
            'status' => 'pending',
        ]);
    }

    public function test_duplicate_transaction_id_submission_is_rejected(): void
    {
        $checkoutRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson('/api/v1/billing/checkout', [
            'plan_slug' => 'growth',
        ]);
        $invoiceId = $checkoutRes->json('data.invoice.id');

        // First submission -> 201
        $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson('/api/v1/billing/payments/submit-trx', [
            'invoice_id' => $invoiceId,
            'gateway' => 'nagad',
            'transaction_reference' => 'NAGAD12345678',
        ])->assertStatus(201);

        // Second submission with exact same reference -> 409 Conflict
        $dupRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson('/api/v1/billing/payments/submit-trx', [
            'invoice_id' => $invoiceId,
            'gateway' => 'nagad',
            'transaction_reference' => 'NAGAD12345678',
        ]);

        $dupRes->assertStatus(409);
    }

    public function test_non_admin_cannot_access_payment_verification_queue(): void
    {
        $res = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
        ])->getJson('/api/v1/control-plane/billing/verification-queue');

        $res->assertStatus(403);
    }

    public function test_admin_can_approve_payment_and_renew_subscription(): void
    {
        // 1. Tenant checkouts Growth plan and submits payment
        $checkoutRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson('/api/v1/billing/checkout', [
            'plan_slug' => 'growth',
            'billing_cycle' => 'monthly',
        ]);
        $invoiceId = $checkoutRes->json('data.invoice.id');

        $submitRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson('/api/v1/billing/payments/submit-trx', [
            'invoice_id' => $invoiceId,
            'gateway' => 'bkash',
            'transaction_reference' => 'BKASH_VERIFY_SUCCESS',
            'sender_number' => '01899887766',
        ]);
        $transactionId = $submitRes->json('data.transaction_id');

        // Reset auth guard between actor requests
        auth('sanctum')->forgetUser();

        // 2. Admin verifies and approves payment
        $verifyRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->postJson("/api/v1/control-plane/billing/transactions/{$transactionId}/verify", [
            'approve' => true,
            'notes' => 'Funds credited to merchant wallet.',
        ]);

        $verifyRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $transactionId,
                    'status' => 'verified',
                ],
            ]);

        // 3. Verify Database state
        $invoice = Invoice::findOrFail($invoiceId);
        $this->assertEquals('paid', $invoice->status);

        $transaction = PaymentTransaction::withoutGlobalScopes()->findOrFail($transactionId);
        $this->assertEquals('verified', $transaction->status);
        $this->assertEquals($this->superAdmin->id, $transaction->verified_by);

        // Verify organization subscription upgraded to Growth
        $growthPlan = Plan::where('slug', 'growth')->firstOrFail();
        $subscription = $this->org->fresh()->subscription;
        $this->assertEquals($growthPlan->id, $subscription->plan_id);
        $this->assertEquals('active', $subscription->status);
        $this->assertTrue($subscription->current_period_end->isFuture());
    }

    public function test_admin_can_reject_payment_and_reset_invoice(): void
    {
        // 1. Tenant checkouts and submits invalid TrxID
        $checkoutRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson('/api/v1/billing/checkout', [
            'plan_slug' => 'growth',
        ]);
        $invoiceId = $checkoutRes->json('data.invoice.id');

        $submitRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson('/api/v1/billing/payments/submit-trx', [
            'invoice_id' => $invoiceId,
            'gateway' => 'bkash',
            'transaction_reference' => 'FAKE_TRX_9999',
        ]);
        $transactionId = $submitRes->json('data.transaction_id');

        auth('sanctum')->forgetUser();

        // 2. Admin rejects payment
        $rejectRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->adminToken}",
        ])->postJson("/api/v1/control-plane/billing/transactions/{$transactionId}/verify", [
            'approve' => false,
            'notes' => 'No matching funds received.',
        ]);

        $rejectRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $transactionId,
                    'status' => 'rejected',
                ],
            ]);

        // 3. Invoice resets to unpaid so tenant can re-submit
        $invoice = Invoice::findOrFail($invoiceId);
        $this->assertEquals('unpaid', $invoice->status);
    }

    public function test_tenant_can_list_and_view_invoices(): void
    {
        // Generate an invoice via checkout
        $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson('/api/v1/billing/checkout', [
            'plan_slug' => 'growth',
        ]);

        // List invoices
        $listRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->getJson('/api/v1/billing/invoices');

        $listRes->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'invoice_number',
                        'amount',
                        'currency',
                        'status',
                    ],
                ],
            ]);

        $invoiceId = $listRes->json('data.0.id');

        // View single invoice
        $showRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->ownerToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->getJson("/api/v1/billing/invoices/{$invoiceId}");

        $showRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $invoiceId,
                ],
            ]);
    }
}

