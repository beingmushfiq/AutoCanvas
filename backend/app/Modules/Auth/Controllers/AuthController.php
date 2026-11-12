<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Services\AuthService;
use App\Modules\Auth\Services\GoogleAuthService;
use App\Modules\Auth\Services\PasswordResetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService,
        protected GoogleAuthService $googleAuthService,
        protected PasswordResetService $passwordResetService
    ) {}

    /**
     * Register a new user and bootstrap tenant context.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'organization_name' => ['nullable', 'string', 'max:255'],
            'timezone' => ['nullable', 'string', 'max:100'],
        ]);

        $result = $this->authService->register($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $result['user']->id,
                    'name' => $result['user']->name,
                    'email' => $result['user']->email,
                ],
                'organization' => [
                    'id' => $result['organization']->id,
                    'name' => $result['organization']->name,
                    'slug' => $result['organization']->slug,
                ],
                'workspace' => [
                    'id' => $result['workspace']->id,
                    'name' => $result['workspace']->name,
                ],
                'token' => $result['token'],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Log in and return Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $result = $this->authService->login($validated['email'], $validated['password']);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $result['user']->id,
                    'name' => $result['user']->name,
                    'email' => $result['user']->email,
                ],
                'token' => $result['token'],
                'active_organization' => $result['active_organization'] ? [
                    'id' => $result['active_organization']->id,
                    'name' => $result['active_organization']->name,
                    'slug' => $result['active_organization']->slug,
                ] : null,
                'active_workspace' => $result['active_workspace'] ? [
                    'id' => $result['active_workspace']->id,
                    'name' => $result['active_workspace']->name,
                ] : null,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Log out current session.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out.',
        ]);
    }

    /**
     * Fetch authenticated user profile with organization and workspace memberships.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'activeOrganization.subscription.plan',
            'activeWorkspace',
            'organizations',
            'workspaces',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_platform_admin' => $user->is_platform_admin,
                ],
                'active_organization' => $user->activeOrganization ? [
                    'id' => $user->activeOrganization->id,
                    'name' => $user->activeOrganization->name,
                    'slug' => $user->activeOrganization->slug,
                    'timezone' => $user->activeOrganization->timezone,
                    'role' => $user->activeOrganization->getRoleOf($user),
                    'plan' => $user->activeOrganization->subscription?->plan?->name ?? 'Starter',
                ] : null,
                'active_workspace' => $user->activeWorkspace ? [
                    'id' => $user->activeWorkspace->id,
                    'name' => $user->activeWorkspace->name,
                    'slug' => $user->activeWorkspace->slug,
                    'role' => $user->activeWorkspace->getRoleOf($user),
                ] : null,
                'organizations' => $user->organizations->map(fn ($org) => [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'role' => $org->pivot->role,
                ]),
                'workspaces' => $user->workspaces->map(fn ($ws) => [
                    'id' => $ws->id,
                    'organization_id' => $ws->organization_id,
                    'name' => $ws->name,
                    'slug' => $ws->slug,
                    'role' => $ws->pivot->role,
                ]),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Switch active workspace.
     */
    public function switchWorkspace(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'workspace_id' => ['required', 'string', 'size:26'],
        ]);

        $workspace = $this->authService->switchWorkspace($request->user(), $validated['workspace_id']);

        return response()->json([
            'success' => true,
            'data' => [
                'active_workspace' => [
                    'id' => $workspace->id,
                    'name' => $workspace->name,
                    'organization_id' => $workspace->organization_id,
                ],
            ],
            'message' => 'Workspace switched successfully.',
        ]);
    }

    /**
     * Redirect to Google OAuth consent screen or return redirect URL.
     */
    public function googleRedirect(Request $request): JsonResponse|RedirectResponse
    {
        $url = $this->googleAuthService->generateRedirectUrl();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'redirect_url' => $url,
                ],
            ]);
        }

        return redirect()->away($url);
    }

    /**
     * Handle Google OAuth callback and redirect to frontend application with token.
     */
    public function googleCallback(Request $request): RedirectResponse|JsonResponse
    {
        $code = $request->query('code');
        $state = $request->query('state');

        if (! $code || ! $state) {
            $frontendUrl = rtrim(config('app.url', 'https://autocanvas.devcenterpoint.com'), '/');
            return redirect("{$frontendUrl}/login?error=" . urlencode('Missing Google OAuth parameters.'));
        }

        try {
            $result = $this->googleAuthService->handleCallback($code, $state);
            $frontendUrl = rtrim(config('app.url', 'https://autocanvas.devcenterpoint.com'), '/');
            $isNew = $result['is_new'] ? '1' : '0';

            return redirect("{$frontendUrl}/auth/callback?token={$result['token']}&is_new={$isNew}");
        } catch (\Throwable $e) {
            $frontendUrl = rtrim(config('app.url', 'https://autocanvas.devcenterpoint.com'), '/');
            return redirect("{$frontendUrl}/login?error=" . urlencode($e->getMessage()));
        }
    }

    /**
     * Send password recovery email with secure reset link.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        $result = $this->passwordResetService->sendResetLink($validated['email']);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }

    /**
     * Reset user password using token and confirmation.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $result = $this->passwordResetService->resetPassword(
            $validated['email'],
            $validated['token'],
            $validated['password']
        );

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }
}
