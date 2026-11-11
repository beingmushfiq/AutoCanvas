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
        // 1. System Settings Table
        Schema::create('system_settings', function (Blueprint $table) {
            $table->string('key', 100)->primary();
            $table->json('value');
            $table->string('category', 50)->default('general');
            $table->boolean('is_secret')->default(false);
            $table->char('updated_by', 26)->nullable();
            $table->timestamps();

            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            $table->index('category');
        });

        // 2. System Change Logs Table
        Schema::create('system_change_logs', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('user_id', 26)->nullable();
            $table->string('entity_type', 100);
            $table->string('entity_id', 100);
            $table->string('action', 50);
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['entity_type', 'entity_id']);
            $table->index('created_at');
        });

        // 3. Control Plane Command Logs Table
        Schema::create('control_plane_command_logs', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('user_id', 26)->nullable();
            $table->text('raw_query');
            $table->string('detected_intent', 100);
            $table->json('parameters');
            $table->enum('safety_tier', ['safe', 'moderate', 'destructive'])->default('safe');
            $table->enum('execution_status', ['pending_confirmation', 'executed', 'rejected', 'failed'])->default('executed');
            $table->string('confirmation_token', 64)->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->json('execution_result')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index('detected_intent');
            $table->index('execution_status');
            $table->index('confirmation_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('control_plane_command_logs');
        Schema::dropIfExists('system_change_logs');
        Schema::dropIfExists('system_settings');
    }
};

