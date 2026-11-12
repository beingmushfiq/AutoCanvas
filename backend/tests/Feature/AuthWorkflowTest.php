<?php

namespace Tests\Feature;

use App\Mail\ResetPasswordMail;
use App\Mail\WelcomeUserMail;
use App\Models\User;
use App\Modules\Auth\Services\GoogleAuthService;
use Carbon\Carbon;
use Database\Seeders\PlanSeeder;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
        config([
            'services.google.client_id' => 'test-google-client-id.apps.googleusercontent.com',
            'services.google.client_secret' => 'test-google-client-secret',
            'services.google.redirect_uri' => 'https://autocanvas.devcenterpoint.com/api/v1/auth/google/callback',
        ]);
    }

    public function test_registration_queues_welcome_email(): void
    {
        Mail::fake();

        $payload = [
            'name' => 'Diana Prince',
            'email' => 'diana@themyscira.com',
            'password' => 'AmazonQueen2026!',
            'organization_name' => 'Themyscira Labs',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.user.email', 'diana@themyscira.com');

        Mail::assertQueued(WelcomeUserMail::class, function ($mail) {
            return $mail->hasTo('diana@themyscira.com') &&
                   $mail->user->email === 'diana@themyscira.com' &&
                   $mail->organization->name === 'Themyscira Labs';
        });
    }

    public function test_forgot_password_sends_email_with_secure_token(): void
    {
        Mail::fake();

        $user = User::create([
            'name' => 'Bruce Wayne',
            'email' => 'bruce@wayne.com',
            'password' => Hash::make('BatCaveSecret123!'),
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'bruce@wayne.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Assert record exists in password_reset_tokens
        $record = DB::table('password_reset_tokens')->where('email', 'bruce@wayne.com')->first();
        $this->assertNotNull($record);
        $this->assertNotEmpty($record->token);

        Mail::assertQueued(ResetPasswordMail::class, function ($mail) {
            return $mail->hasTo('bruce@wayne.com') &&
                   $mail->user->email === 'bruce@wayne.com' &&
                   ! empty($mail->token);
        });
    }

    public function test_forgot_password_returns_success_for_nonexistent_email_to_prevent_enumeration(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'nobody@doesnotexist.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        Mail::assertNothingQueued();
    }

    public function test_reset_password_updates_password_and_revokes_old_sessions(): void
    {
        $user = User::create([
            'name' => 'Clark Kent',
            'email' => 'clark@dailyplanet.com',
            'password' => Hash::make('Smallville123!'),
            'status' => 'active',
        ]);

        // Issue a dummy Sanctum token
        $token1 = $user->createToken('device_1')->plainTextToken;
        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $user->id]);

        $rawToken = 'test-raw-reset-token-1234567890';
        DB::table('password_reset_tokens')->insert([
            'email' => 'clark@dailyplanet.com',
            'token' => Hash::make($rawToken),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'clark@dailyplanet.com',
            'token' => $rawToken,
            'password' => 'Metropolis2026NewPass!',
            'password_confirmation' => 'Metropolis2026NewPass!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify password updated
        $user->refresh();
        $this->assertTrue(Hash::check('Metropolis2026NewPass!', $user->password));

        // Verify old Sanctum tokens are revoked
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);

        // Verify reset token record is purged
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'clark@dailyplanet.com']);
    }

    public function test_reset_password_rejects_expired_token(): void
    {
        $user = User::create([
            'name' => 'Barry Allen',
            'email' => 'barry@star.labs',
            'password' => Hash::make('SpeedForce123!'),
            'status' => 'active',
        ]);

        $rawToken = 'expired-token';
        DB::table('password_reset_tokens')->insert([
            'email' => 'barry@star.labs',
            'token' => Hash::make($rawToken),
            'created_at' => Carbon::now()->subMinutes(61), // Expired
        ]);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'barry@star.labs',
            'token' => $rawToken,
            'password' => 'NewSpeedForce123!',
            'password_confirmation' => 'NewSpeedForce123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }

    public function test_google_redirect_generates_valid_oauth_url_and_stores_state(): void
    {
        $response = $this->getJson('/api/v1/auth/google/redirect');

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data' => ['redirect_url']]);

        $redirectUrl = $response->json('data.redirect_url');
        $this->assertStringContainsString('accounts.google.com/o/oauth2/v2/auth', $redirectUrl);
        $this->assertStringContainsString('client_id=test-google-client-id.apps.googleusercontent.com', $redirectUrl);

        parse_str(parse_url($redirectUrl, PHP_URL_QUERY), $queryParams);
        $this->assertNotEmpty($queryParams['state']);
        $this->assertTrue(Cache::has("google_oauth_state_{$queryParams['state']}"));
    }

    public function test_google_callback_creates_new_user_and_provisions_tenant(): void
    {
        Mail::fake();

        $state = 'valid-test-csrf-state';
        Cache::put("google_oauth_state_{$state}", true, now()->addMinutes(5));

        // Mock Google HTTP responses (token exchange + userinfo)
        $mock = new MockHandler([
            new Response(200, [], json_encode([
                'access_token' => 'mock-google-access-token',
                'id_token' => 'mock-google-id-token',
                'token_type' => 'Bearer',
            ])),
            new Response(200, [], json_encode([
                'sub' => 'google-uid-10928374',
                'email' => 'hal.jordan@greenlantern.org',
                'name' => 'Hal Jordan',
                'picture' => 'https://lh3.googleusercontent.com/photo.jpg',
                'email_verified' => true,
            ])),
        ]);

        $handlerStack = HandlerStack::create($mock);
        $mockClient = new Client(['handler' => $handlerStack]);

        // Bind mock GoogleAuthService with mock HTTP client
        $this->app->instance(GoogleAuthService::class, new GoogleAuthService($mockClient));

        $response = $this->get("/api/v1/auth/google/callback?code=mock-auth-code&state={$state}");

        // Assert redirect to frontend callback with token
        $response->assertStatus(302);
        $targetUrl = $response->headers->get('Location');
        $this->assertStringContainsString('/auth/callback?token=', $targetUrl);
        $this->assertStringContainsString('is_new=1', $targetUrl);

        // Verify User was created
        $user = User::where('email', 'hal.jordan@greenlantern.org')->first();
        $this->assertNotNull($user);
        $this->assertEquals('google-uid-10928374', $user->google_id);
        $this->assertNotNull($user->email_verified_at);

        // Verify Organization was created
        $this->assertDatabaseHas('organizations', [
            'billing_email' => 'hal.jordan@greenlantern.org',
        ]);

        // Verify Welcome email was queued
        Mail::assertQueued(WelcomeUserMail::class, function ($mail) {
            return $mail->hasTo('hal.jordan@greenlantern.org');
        });
    }

    public function test_google_callback_links_existing_user(): void
    {
        $existingUser = User::create([
            'name' => 'Arthur Curry',
            'email' => 'arthur@atlantis.com',
            'password' => Hash::make('AtlantisKey123!'),
            'status' => 'active',
        ]);

        $state = 'valid-test-csrf-state-2';
        Cache::put("google_oauth_state_{$state}", true, now()->addMinutes(5));

        $mock = new MockHandler([
            new Response(200, [], json_encode([
                'access_token' => 'mock-google-access-token-2',
            ])),
            new Response(200, [], json_encode([
                'sub' => 'google-uid-999888777',
                'email' => 'arthur@atlantis.com',
                'name' => 'Arthur Curry',
                'picture' => 'https://lh3.googleusercontent.com/aquaman.jpg',
            ])),
        ]);

        $handlerStack = HandlerStack::create($mock);
        $mockClient = new Client(['handler' => $handlerStack]);

        $this->app->instance(GoogleAuthService::class, new GoogleAuthService($mockClient));

        $response = $this->get("/api/v1/auth/google/callback?code=mock-auth-code-2&state={$state}");

        $response->assertStatus(302);
        $targetUrl = $response->headers->get('Location');
        $this->assertStringContainsString('is_new=0', $targetUrl);

        $existingUser->refresh();
        $this->assertEquals('google-uid-999888777', $existingUser->google_id);
    }
}
