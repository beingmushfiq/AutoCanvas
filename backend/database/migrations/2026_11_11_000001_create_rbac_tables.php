<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Permissions Table (Atomic Capabilities)
        Schema::create('permissions', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->string('name', 100)->unique(); // e.g. 'system.organizations.manage'
            $table->string('display_name', 150);
            $table->string('category', 50);       // 'system', 'organization', 'brand', 'content', 'publishing', 'community', 'analytics'
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('category');
        });

        // 2. Roles Table (Permission Bundles)
        Schema::create('roles', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->string('name', 100)->unique(); // e.g. 'superadmin', 'org_owner'
            $table->string('display_name', 150);
            $table->enum('scope', ['system', 'organization', 'workspace'])->default('organization');
            $table->boolean('is_system_preset')->default(false);
            $table->timestamps();

            $table->index('scope');
        });

        // 3. Role Permissions Pivot Table
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->char('role_id', 26);
            $table->char('permission_id', 26);

            $table->primary(['role_id', 'permission_id']);
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
        });

        // 4. User Roles Table (User to Role with optional Tenant Context)
        Schema::create('user_roles', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('user_id', 26);
            $table->char('role_id', 26);
            $table->char('organization_id', 26)->nullable(); // Nullable for system-wide roles (superadmin)
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');

            $table->index(['user_id', 'organization_id'], 'idx_ur_user_org');
            $table->index('role_id', 'idx_ur_role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('permissions');
    }
};

