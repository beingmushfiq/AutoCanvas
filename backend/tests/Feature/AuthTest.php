<?php

namespace Tests\Feature;

use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_user_can_register_and_automatically_receives_organization_and_token(): void
    {
        $payload = [
            'name' => 'Alice Founder',
            'email' => 'alice@example.com',
            'password' => 'secret12345',
            'organization_name' => 'Apex Agency',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'name', 'email'],
                    'organization' => ['id', 'name', 'slug'],
                    'workspace' => ['id', 'name'],
                    'token',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'alice@example.com',
        ]);

        $this->assertDatabaseHas('organizations', [
            'name' => 'Apex Agency',
            'slug' => 'apex-agency',
        ]);

        $this->assertDatabaseHas('workspaces', [
            'name' => 'Default Workspace',
            'is_default' => 1,
        ]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Bob Test',
            'email' => 'bob@example.com',
            'password' => 'password123',
            'organization_name' => 'Bob Corp',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'bob@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'name', 'email'],
                    'token',
                    'active_organization',
                    'active_workspace',
                ],
            ]);
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Bob Test',
            'email' => 'bob@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'bob@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_fetch_profile_and_memberships(): void
    {
        $regResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Charlie User',
            'email' => 'charlie@example.com',
            'password' => 'password123',
            'organization_name' => 'Charlie Media',
        ]);

        $token = $regResponse->json('data.token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'charlie@example.com',
                    ],
                    'active_organization' => [
                        'name' => 'Charlie Media',
                        'role' => 'owner',
                    ],
                ],
            ]);
    }
}
