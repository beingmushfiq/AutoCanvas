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
        // 1. Add atomic lock columns and first comment options to publishing_dispatches
        Schema::table('publishing_dispatches', function (Blueprint $table) {
            if (!Schema::hasColumn('publishing_dispatches', 'locked_at')) {
                $table->timestamp('locked_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('publishing_dispatches', 'lock_token')) {
                $table->string('lock_token', 64)->nullable()->after('locked_at');
            }
            if (!Schema::hasColumn('publishing_dispatches', 'first_comment_text')) {
                $table->text('first_comment_text')->nullable()->after('payload_snapshot');
            }
        });

        // 2. Create channel_dispatches table for multi-channel fan-out
        Schema::create('channel_dispatches', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('dispatch_id')->index();
            $table->ulid('organization_id')->index();
            $table->string('channel', 32);
            $table->string('idempotency_key', 64)->unique();
            $table->string('status', 30)->default('pending')->index();
            $table->string('platform_post_id', 255)->nullable();
            $table->string('platform_post_url', 512)->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedTinyInteger('retry_count')->default(0);
            $table->text('first_comment_text')->nullable();
            $table->string('first_comment_status', 30)->default('none');
            $table->string('first_comment_id', 255)->nullable();
            $table->timestamp('first_comment_scheduled_at')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->foreign('dispatch_id')->references('id')->on('publishing_dispatches')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->index(['organization_id', 'channel', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('channel_dispatches');

        Schema::table('publishing_dispatches', function (Blueprint $table) {
            if (Schema::hasColumn('publishing_dispatches', 'first_comment_text')) {
                $table->dropColumn('first_comment_text');
            }
            if (Schema::hasColumn('publishing_dispatches', 'lock_token')) {
                $table->dropColumn('lock_token');
            }
            if (Schema::hasColumn('publishing_dispatches', 'locked_at')) {
                $table->dropColumn('locked_at');
            }
        });
    }
};

