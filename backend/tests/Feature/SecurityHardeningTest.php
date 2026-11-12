<?php

namespace Tests\Feature;

use App\Core\Scopes\TenantScope;
use App\Core\Security\SvgSanitizer;
use App\Models\User;
use App\Modules\Billing\Models\Invoice;
use App\Modules\Billing\Models\PaymentTransaction;
use App\Modules\Billing\Models\Plan;
use App\Modules\Brand\Models\Brand;
use App\Modules\Brand\Models\BrandAsset;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Research\Models\RssFeed;
use App\Modules\Research\Services\RssIngestionService;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $userToken;
    protected Organization $org;
    protected Workspace $workspace;
    protected Brand $brand;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        $this->seed(RbacSeeder::class);

        $this->user = User::create([
            'name' => 'SecOps Test User',
            'email' => 'secops@autocanvas.io',
            'password' => bcrypt('Password123!'),
            'status' => 'active',
        ]);

        $this->org = Organization::create([
            'name' => 'SecOps Guard Corp',
            'slug' => 'secops-guard',
            'billing_email' => 'billing@secops-guard.com',
            'status' => 'active',
        ]);

        $this->workspace = Workspace::create([
            'organization_id' => $this->org->id,
            'name' => 'SecOps Primary',
            'slug' => 'secops-primary',
            'is_default' => true,
        ]);

        OrganizationMember::create([
            'organization_id' => $this->org->id,
            'user_id' => $this->user->id,
            'role' => 'owner',
        ]);

        WorkspaceMember::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'role' => 'admin',
        ]);

        $this->user->update([
            'current_organization_id' => $this->org->id,
            'current_workspace_id' => $this->workspace->id,
        ]);

        $this->userToken = $this->user->createToken('secops_token')->plainTextToken;

        $this->brand = Brand::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'name' => 'Hardened Brand',
            'slug' => 'hardened-brand',
            'industry' => 'Cybersecurity',
            'status' => 'active',
        ]);
    }

    /**
     * Test VULN-01: Payment webhook rejects unauthenticated requests when secret is configured.
     */
    public function test_payment_webhook_rejects_unauthenticated_requests_when_secret_configured(): void
    {
        Config::set('services.bkash.webhook_secret', 'super_secret_bkash_key_999');

        $response = $this->postJson('/api/v1/webhooks/bkash', [
            'paymentID' => 'PAY12345678',
            'trxID' => 'TRXBKASH99',
            'transactionStatus' => 'Completed',
            'amount' => 1500,
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('error.code', 'UNAUTHORIZED_WEBHOOK');
    }

    /**
     * Test VULN-01: Payment webhook validates signature and processes transaction.
     */
    public function test_payment_webhook_accepts_valid_authenticated_request(): void
    {
        Config::set('services.bkash.webhook_secret', 'super_secret_bkash_key_999');

        $plan = Plan::first();
        $invoice = Invoice::create([
            'organization_id' => $this->org->id,
            'invoice_number' => 'INV-SEC-001',
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
            'amount' => 1500,
            'currency' => 'BDT',
            'billing_period_start' => now()->toDateString(),
            'billing_period_end' => now()->addMonth()->toDateString(),
            'due_date' => now()->addDays(3),
            'status' => 'unpaid',
        ]);

        $transaction = PaymentTransaction::create([
            'invoice_id' => $invoice->id,
            'organization_id' => $this->org->id,
            'gateway' => 'bkash',
            'transaction_reference' => 'TRXBKASH99',
            'normalized_trx_id' => 'TRXBKASH99',
            'idempotency_key' => 'idemp_sec_01',
            'amount' => 1500,
            'currency' => 'BDT',
            'status' => 'pending',
        ]);

        $response = $this->withHeaders([
            'X-Webhook-Secret' => 'super_secret_bkash_key_999',
        ])->postJson('/api/v1/webhooks/bkash', [
            'paymentID' => 'PAY12345678',
            'trxID' => 'TRXBKASH99',
            'transactionStatus' => 'Completed',
            'amount' => 1500,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals('verified', $transaction->fresh()->status);
        $this->assertEquals('paid', $invoice->fresh()->status);
    }

    /**
     * Test VULN-01: Payment webhook prevents fraud by rejecting mismatched amounts.
     */
    public function test_payment_webhook_rejects_mismatched_amount(): void
    {
        Config::set('services.bkash.webhook_secret', 'super_secret_bkash_key_999');

        $plan = Plan::first();
        $invoice = Invoice::create([
            'organization_id' => $this->org->id,
            'invoice_number' => 'INV-SEC-002',
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
            'amount' => 5000,
            'currency' => 'BDT',
            'billing_period_start' => now()->toDateString(),
            'billing_period_end' => now()->addMonth()->toDateString(),
            'due_date' => now()->addDays(3),
            'status' => 'unpaid',
        ]);

        $transaction = PaymentTransaction::create([
            'invoice_id' => $invoice->id,
            'organization_id' => $this->org->id,
            'gateway' => 'bkash',
            'transaction_reference' => 'TRXFRAUD01',
            'normalized_trx_id' => 'TRXFRAUD01',
            'idempotency_key' => 'idemp_sec_02',
            'amount' => 5000,
            'currency' => 'BDT',
            'status' => 'pending',
        ]);

        // Attacker attempts to pay 10 BDT for a 5000 BDT invoice
        $response = $this->withHeaders([
            'X-Webhook-Secret' => 'super_secret_bkash_key_999',
        ])->postJson('/api/v1/webhooks/bkash', [
            'paymentID' => 'PAY99999999',
            'trxID' => 'TRXFRAUD01',
            'transactionStatus' => 'Completed',
            'amount' => 10,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'AMOUNT_MISMATCH');

        $this->assertEquals('pending', $transaction->fresh()->status);
        $this->assertEquals('unpaid', $invoice->fresh()->status);
    }

    /**
     * Test VULN-02: SvgSanitizer neutralizes embedded script and event handler vectors.
     */
    public function test_svg_sanitizer_neutralizes_xss_and_xxe_payloads(): void
    {
        $maliciousSvg = <<<'SVG'
<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg xmlns="http://www.w3.org/2000/svg" onload="alert('XSS_ONLOAD')">
    <script type="text/javascript">alert('XSS_SCRIPT');</script>
    <a href="javascript:alert('XSS_HREF')">
        <text y="20">Click me</text>
    </a>
    <foreignObject width="100" height="100">
        <iframe src="https://evil.com"></iframe>
    </foreignObject>
    <circle cx="50" cy="50" r="40" fill="red" onclick="alert('XSS_CLICK')"/>
</svg>
SVG;

        $sanitized = SvgSanitizer::sanitize($maliciousSvg);

        $this->assertStringNotContainsString('<script', $sanitized);
        $this->assertStringNotContainsString('alert(', $sanitized);
        $this->assertStringNotContainsString('onload=', $sanitized);
        $this->assertStringNotContainsString('onclick=', $sanitized);
        $this->assertStringNotContainsString('javascript:', $sanitized);
        $this->assertStringNotContainsString('foreignObject', $sanitized);
        $this->assertStringNotContainsString('iframe', $sanitized);
        $this->assertStringNotContainsString('<!ENTITY', $sanitized);
        $this->assertStringNotContainsString('SYSTEM', $sanitized);
    }

    /**
     * Test VULN-02: BrandAssetController store endpoint sanitizes uploaded SVGs.
     */
    public function test_brand_asset_upload_sanitizes_svg_and_neutralizes_stored_xss(): void
    {
        Storage::fake('public');

        $svgPayload = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>evil()</script><circle cx="5" cy="5" r="5"/></svg>';
        $file = UploadedFile::fake()->createWithContent('malicious_logo.svg', $svgPayload);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->userToken}",
            'X-Workspace-Id' => $this->workspace->id,
        ])->postJson("/api/v1/brands/{$this->brand->id}/assets", [
            'file' => $file,
            'type' => 'logo',
            'name' => 'Sanitized Logo',
        ]);

        $response->assertStatus(201);

        /** @var BrandAsset|null $asset */
        $asset = BrandAsset::first();
        $this->assertNotNull($asset);

        // Verify stored file on disk has zero script or onload triggers
        $savedContent = Storage::disk('public')->get($asset->file_path);
        $this->assertStringNotContainsString('<script', $savedContent);
        $this->assertStringNotContainsString('onload', $savedContent);
        $this->assertStringNotContainsString('alert', $savedContent);
    }

    /**
     * Test VULN-03: TenantScope fails closed (1 = 0) when organization context is null outside console.
     */
    public function test_tenant_scope_fails_closed_when_organization_context_is_null(): void
    {
        // Unbind any current organization
        app()->forgetInstance('current_organization_id');
        auth()->logout();

        $scope = new TenantScope;
        $scope->enforceInConsole = true;
        $builder = Brand::query();
        
        $scope->apply($builder, new Brand);

        // When organizationId is null, the builder receives '1 = 0' to fail closed
        $this->assertStringContainsString('1 = 0', $builder->toSql());
    }

    /**
     * Test VULN-04: RssIngestionService prevents SSRF redirect to internal/cloud metadata.
     */
    public function test_rss_ingestion_prevents_ssrf_redirect_to_private_ip(): void
    {
        $feed = RssFeed::create([
            'organization_id' => $this->org->id,
            'workspace_id' => $this->workspace->id,
            'brand_id' => $this->brand->id,
            'name' => 'Suspicious Feed',
            'url' => 'https://github.com/feed.xml',
            'category' => 'tech',
            'fetch_frequency_minutes' => 60,
            'status' => 'active',
        ]);

        // Mock public URL redirecting to AWS/cloud metadata 169.254.169.254
        Http::fake([
            'https://github.com/feed.xml' => Http::response('', 302, [
                'Location' => 'http://169.254.169.254/latest/meta-data/',
            ]),
            'http://169.254.169.254/*' => Http::response('ami-id-secret', 200),
        ]);

        $service = new RssIngestionService;

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $service->syncFeed($feed);
    }

    /**
     * Test VULN-05: Magic review routes and webhooks enforce rate limiting.
     */
    public function test_magic_review_routes_enforce_rate_limiting(): void
    {
        // Make 35 requests to /api/v1/review/invalid-token (limit is 30 per minute)
        $hitRateLimit = false;

        for ($i = 0; $i < 35; $i++) {
            $response = $this->getJson("/api/v1/review/token_{$i}");
            if ($response->status() === 429) {
                $hitRateLimit = true;
                break;
            }
        }

        $this->assertTrue($hitRateLimit, 'Expected request to be rate-limited with HTTP 429 after exceeding limit.');
    }

    /**
     * Test VULN-06: Responses carry enterprise HTTP security headers.
     */
    public function test_responses_include_enterprise_security_headers(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200);
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }
}
