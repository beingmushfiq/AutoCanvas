<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use App\Modules\ControlPlane\Models\SystemSetting;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EmergencyOperationsTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $operator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RbacSeeder::class);

        $this->admin = User::create([
            'name' => 'Root Sovereign',
            'email' => 'root@autocanvas.io',
            'password' => bcrypt('password123'),
            'is_platform_admin' => true,
            'status' => 'active',
        ]);
        $this->admin->assignRole('superadmin');

        $this->operator = User::create([
            'name' => 'Standard Operator',
            'email' => 'operator@clientcorp.com',
            'password' => bcrypt('password123'),
            'is_platform_admin' => false,
            'status' => 'active',
        ]);
    }

    public function test_emergency_pause_all_command_freezes_automations(): void
    {
        $exitCode = $this->artisan('emergency:pause-all', [
            '--reason' => 'Critical platform-wide memory anomaly detected',
        ])->run();

        $this->assertEquals(0, $exitCode);

        $setting = SystemSetting::where('key', 'pause_all_automations')->first();
        $this->assertNotNull($setting);
        $this->assertTrue((bool) $setting->value);

        $log = SystemChangeLog::where('action', 'circuit_breaker.cli_activated')->first();
        $this->assertNotNull($log);
        $this->assertEquals('emergency_circuit_breaker', $log->entity_type);
        $this->assertEquals('pause_all_automations', $log->entity_id);
        $this->assertTrue($log->new_values['paused']);
        $this->assertEquals('Critical platform-wide memory anomaly detected', $log->new_values['reason']);
    }

    public function test_emergency_resume_all_command_restores_operations(): void
    {
        // First activate pause
        SystemSetting::updateOrCreate(
            ['key' => 'pause_all_automations'],
            ['value' => true, 'category' => 'emergency', 'is_secret' => false]
        );

        $exitCode = $this->artisan('emergency:resume-all', [
            '--reason' => 'All upstream API anomalies mitigated',
        ])->run();

        $this->assertEquals(0, $exitCode);

        $setting = SystemSetting::where('key', 'pause_all_automations')->first();
        $this->assertNotNull($setting);
        $this->assertFalse((bool) $setting->value);

        $log = SystemChangeLog::where('action', 'circuit_breaker.cli_deactivated')->first();
        $this->assertNotNull($log);
        $this->assertFalse($log->new_values['paused']);
        $this->assertEquals('All upstream API anomalies mitigated', $log->new_values['reason']);
    }

    public function test_emergency_promote_admin_grants_superadmin_privileges(): void
    {
        $this->assertFalse($this->operator->is_platform_admin);
        $this->assertFalse($this->operator->roles()->where('name', 'superadmin')->exists());

        $exitCode = $this->artisan('emergency:promote-admin', [
            'email' => $this->operator->email,
        ])->run();

        $this->assertEquals(0, $exitCode);

        $this->operator->refresh();
        $this->assertTrue($this->operator->is_platform_admin);
        $this->assertTrue($this->operator->roles()->where('name', 'superadmin')->exists());

        $log = SystemChangeLog::where('action', 'user.emergency_promoted_admin')->first();
        $this->assertNotNull($log);
        $this->assertEquals($this->operator->id, $log->entity_id);
    }

    public function test_emergency_promote_admin_fails_for_nonexistent_user(): void
    {
        $exitCode = $this->artisan('emergency:promote-admin', [
            'email' => 'ghost.user@unknown.io',
        ])->run();

        $this->assertEquals(1, $exitCode);
    }

    public function test_emergency_revoke_tokens_invalidates_target_user_sessions(): void
    {
        // Issue tokens to operator
        $this->operator->createToken('session-1');
        $this->operator->createToken('session-2');
        $this->operator->createToken('session-3');

        // Issue token to admin (should not be revoked)
        $this->admin->createToken('admin-session');

        $this->assertEquals(3, $this->operator->tokens()->count());
        $this->assertEquals(1, $this->admin->tokens()->count());

        $exitCode = $this->artisan('emergency:revoke-tokens', [
            '--user' => $this->operator->email,
        ])->run();

        $this->assertEquals(0, $exitCode);
        $this->assertEquals(0, $this->operator->tokens()->count());
        $this->assertEquals(1, $this->admin->tokens()->count());

        $log = SystemChangeLog::where('action', 'tokens.emergency_revoked_user')->first();
        $this->assertNotNull($log);
        $this->assertEquals($this->operator->id, $log->entity_id);
    }

    public function test_emergency_revoke_all_tokens_platform_wide(): void
    {
        $this->operator->createToken('op-1');
        $this->admin->createToken('adm-1');

        $this->assertEquals(2, DB::table('personal_access_tokens')->count());

        $exitCode = $this->artisan('emergency:revoke-tokens', [
            '--all' => true,
            '--force' => true,
        ])->run();

        $this->assertEquals(0, $exitCode);
        $this->assertEquals(0, DB::table('personal_access_tokens')->count());

        $log = SystemChangeLog::where('action', 'tokens.emergency_wipe_all')->first();
        $this->assertNotNull($log);
        $this->assertEquals('all', $log->entity_id);
    }

    public function test_emergency_revoke_all_tokens_can_be_cancelled(): void
    {
        $this->operator->createToken('op-token');
        $this->assertEquals(1, DB::table('personal_access_tokens')->count());

        $this->artisan('emergency:revoke-tokens', ['--all' => true])
            ->expectsConfirmation("Are you sure you want to REVOKE ALL (1) active tokens platform-wide? All users will be logged out immediately.", 'no')
            ->expectsOutput('Token revocation cancelled.')
            ->assertSuccessful();

        $this->assertEquals(1, DB::table('personal_access_tokens')->count());
    }
}

