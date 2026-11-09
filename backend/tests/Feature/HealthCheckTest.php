<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    /**
     * Test the API v1 health check endpoint.
     */
    public function test_api_v1_health_check_returns_success(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'service',
                'version',
                'environment',
                'checks' => [
                    'database',
                    'redis',
                ],
                'timestamp',
            ])
            ->assertJson([
                'status' => 'ok',
                'service' => 'AutoCanvas Core API',
                'version' => '1.0.0',
            ]);
    }
}
