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
        // Organizations (Tenant Root)
        Schema::create('organizations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('timezone')->default('UTC');
            $table->string('billing_email');
            $table->enum('status', ['active', 'suspended', 'cancelled'])->default('active');
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Workspaces (Operational Subdivisions within Organization)
        Schema::create('workspaces', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['organization_id', 'slug']);
        });

        // Organization Members (User <-> Organization Role Pivot)
        Schema::create('organization_members', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('role', [
                'owner',
                'admin',
                'manager',
                'editor',
                'designer',
                'publisher',
                'analyst',
                'community_manager',
                'viewer',
                'member',
            ])->default('member');
            $table->timestamps();

            $table->unique(['organization_id', 'user_id']);
        });

        // Workspace Members (User <-> Workspace Role Pivot)
        Schema::create('workspace_members', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('role', [
                'owner',
                'admin',
                'manager',
                'editor',
                'designer',
                'publisher',
                'analyst',
                'community_manager',
                'viewer',
                'member',
            ])->default('member');
            $table->timestamps();

            $table->unique(['workspace_id', 'user_id']);
        });

        // Invitations
        Schema::create('invitations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUlid('workspace_id')->nullable()->constrained('workspaces')->nullOnDelete();
            $table->string('email');
            $table->enum('role', [
                'owner',
                'admin',
                'manager',
                'editor',
                'designer',
                'publisher',
                'analyst',
                'community_manager',
                'viewer',
                'member',
            ])->default('member');
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitations');
        Schema::dropIfExists('workspace_members');
        Schema::dropIfExists('organization_members');
        Schema::dropIfExists('workspaces');
        Schema::dropIfExists('organizations');
    }
};
