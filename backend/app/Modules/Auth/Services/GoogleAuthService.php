<?php

namespace App\Modules\Auth\Services;

use App\Mail\WelcomeUserMail;
use App\Models\Role;
use App\Models\User;
use App\Modules\Billing\Models\Plan;
use App\Modules\Billing\Models\Subscription;
use App\Modules\Organization\Models\Organization;
use App\Modules\Organization\Models\OrganizationMember;
use App\Modules\Organization\Services\AuditLogger;
use App\Modules\Workspace\Models\Workspace;
use App\Modules\Workspace\Models\WorkspaceMember;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GoogleAuthService
{
    protected Client $httpClient;

    public function __construct(?Client $httpClient = null)
    {
        $this->httpClient = $httpClient ?? new Client(['timeout' => 15]);
    }

    /**
     * Generate Google OAuth authorization redirect URL with anti-CSRF state.
     */
    public function generateRedirectUrl(): string
    {
        $clientId = config('services.google.client_id');
        $redirectUri = config('services.google.redirect_uri');

        if (empty($clientId)) {
            throw new \RuntimeException('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
        }

        $state = Str::random(40);
        Cache::put("google_oauth_state_{$state}", true, now()->addMinutes(10));

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid profile email',
            'state' => $state,
            'access_type' => 'offline',
            'prompt' => 'select_account',
        ]);

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . $query;
    }

    /**
     * Handle return from Google: validate state, exchange code, fetch profile, and resolve user.
     */
    public function handleCallback(string $code, string $state): array
    {
        // 1. Verify CSRF State
        if (! Cache::pull("google_oauth_state_{$state}")) {
            throw ValidationException::withMessages([
                'state' => ['Invalid or expired OAuth state parameter. Please try authenticating again.'],
            ]);
        }

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');
        $redirectUri = config('services.google.redirect_uri');

        // 2. Exchange authorization code for tokens
        try {
            $tokenResponse = $this->httpClient->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'code' => $code,
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'redirect_uri' => $redirectUri,
                    'grant_type' => 'authorization_code',
                ],
            ]);

            $tokens = json_decode($tokenResponse->getBody()->getContents(), true);
            $accessToken = $tokens['access_token'] ?? null;

            if (! $accessToken) {
                throw new \RuntimeException('Failed to obtain access token from Google.');
            }

            // 3. Fetch user profile from Google OpenID Connect
            $userinfoResponse = $this->httpClient->get('https://openidconnect.googleapis.com/v1/userinfo', [
                'headers' => [
                    'Authorization' => "Bearer {$accessToken}",
                ],
            ]);

            $profile = json_decode($userinfoResponse->getBody()->getContents(), true);
        } catch (\Throwable $e) {
            throw ValidationException::withMessages([
                'google' => ['Google authentication communication failed: ' . $e->getMessage()],
            ]);
        }

        $googleId = $profile['sub'] ?? null;
        $email = isset($profile['email']) ? strtolower(trim($profile['email'])) : null;
        $name = $profile['name'] ?? 'Google User';
        $avatarUrl = $profile['picture'] ?? null;

        if (! $googleId || ! $email) {
            throw ValidationException::withMessages([
                'google' => ['Could not retrieve valid Google profile information.'],
            ]);
        }

        // 4. Resolve User: Find existing user by google_id or email
        $user = User::where('google_id', $googleId)->first();
        $isNew = false;

        if (! $user) {
            $user = User::where('email', $email)->first();

            if ($user) {
                // Link Google identity to existing email account
                $user->update([
                    'google_id' => $googleId,
                    'avatar_url' => $user->avatar_url ?: $avatarUrl,
                    'email_verified_at' => $user->email_verified_at ?: now(),
                ]);
            } else {
                // Brand-new registration via Google
                $isNew = true;
                $user = DB::transaction(function () use ($googleId, $email, $name, $avatarUrl) {
                    $newUser = User::create([
                        'name' => $name,
                        'email' => $email,
                        'google_id' => $googleId,
                        'avatar_url' => $avatarUrl,
                        'password' => null,
                        'status' => 'active',
                        'email_verified_at' => now(),
                    ]);

                    // Generate Organization
                    $orgName = "{$name}'s Organization";
                    $baseSlug = Str::slug($orgName) ?: 'org';
                    $slug = $baseSlug;
                    $counter = 1;
                    while (Organization::where('slug', $slug)->exists()) {
                        $slug = "{$baseSlug}-{$counter}";
                        $counter++;
                    }

                    $organization = Organization::create([
                        'name' => $orgName,
                        'slug' => $slug,
                        'timezone' => 'UTC',
                        'billing_email' => $newUser->email,
                        'status' => 'active',
                    ]);

                    // Create Default Workspace
                    $workspace = Workspace::create([
                        'organization_id' => $organization->id,
                        'name' => 'Default Workspace',
                        'slug' => 'default',
                        'is_default' => true,
                    ]);

                    // Assign Owner Roles
                    OrganizationMember::create([
                        'organization_id' => $organization->id,
                        'user_id' => $newUser->id,
                        'role' => 'owner',
                    ]);

                    WorkspaceMember::create([
                        'workspace_id' => $workspace->id,
                        'user_id' => $newUser->id,
                        'role' => 'owner',
                    ]);

                    if (Role::where('name', 'org_owner')->exists()) {
                        $newUser->assignRole('org_owner', $organization->id);
                    }

                    $newUser->update([
                        'current_organization_id' => $organization->id,
                        'current_workspace_id' => $workspace->id,
                    ]);

                    // Attach Starter Plan
                    $starterPlan = Plan::where('slug', 'starter')->first();
                    if ($starterPlan) {
                        Subscription::create([
                            'organization_id' => $organization->id,
                            'plan_id' => $starterPlan->id,
                            'status' => 'active',
                            'current_period_start' => now(),
                            'current_period_end' => now()->addMonth(),
                        ]);
                    }

                    // Audit Logs
                    AuditLogger::log('user.registered_google', $newUser, null, ['email' => $newUser->email], $organization->id, $workspace->id);
                    AuditLogger::log('organization.created', $organization, null, ['name' => $organization->name], $organization->id, $workspace->id);

                    // Dispatch Welcome Email
                    Mail::to($newUser->email)->queue(new WelcomeUserMail($newUser, $organization, $workspace));

                    return $newUser;
                });
            }
        }

        // 5. Ensure workspace context exists
        if (! $user->current_organization_id || ! $user->current_workspace_id) {
            $firstOrg = $user->organizations()->first();
            if ($firstOrg) {
                $firstWs = $firstOrg->workspaces()->first();
                $user->update([
                    'current_organization_id' => $firstOrg->id,
                    'current_workspace_id' => $firstWs?->id,
                ]);
            }
        }

        $token = $user->createToken('google_auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
            'is_new' => $isNew,
        ];
    }
}

