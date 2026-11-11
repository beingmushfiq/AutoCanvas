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
        // 1. Add publishing tracking columns to content_variants if not already present
        Schema::table('content_variants', function (Blueprint $table) {
            if (!Schema::hasColumn('content_variants', 'publishing_status')) {
                $table->string('publishing_status', 30)->default('draft')->after('platform_options');
            }
            if (!Schema::hasColumn('content_variants', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->after('publishing_status');
            }
            if (!Schema::hasColumn('content_variants', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('scheduled_at');
            }
        });

        // 2. Create publishing_dispatches table
        Schema::create('publishing_dispatches', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('brand_id')->index();
            $table->ulid('content_item_id')->index();
            $table->ulid('content_variant_id')->index();
            $table->ulid('social_account_id')->index();
            $table->string('idempotency_key')->unique();
            $table->string('queue_name', 50)->default('publishing-high')->index();
            $table->string('status', 30)->default('queued')->index(); // queued, processing, published, failed, cancelled
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->string('platform_post_id', 150)->nullable()->index();
            $table->string('platform_permalink', 500)->nullable();
            $table->json('payload_snapshot');
            $table->json('response_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->string('error_code', 80)->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('cascade');
            $table->foreign('content_item_id')->references('id')->on('content_items')->onDelete('cascade');
            $table->foreign('content_variant_id')->references('id')->on('content_variants')->onDelete('cascade');
            $table->foreign('social_account_id')->references('id')->on('social_accounts')->onDelete('cascade');

            $table->index(['organization_id', 'status']);
            $table->index(['brand_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('publishing_dispatches');

        Schema::table('content_variants', function (Blueprint $table) {
            if (Schema::hasColumn('content_variants', 'published_at')) {
                $table->dropColumn('published_at');
            }
            if (Schema::hasColumn('content_variants', 'scheduled_at')) {
                $table->dropColumn('scheduled_at');
            }
            if (Schema::hasColumn('content_variants', 'publishing_status')) {
                $table->dropColumn('publishing_status');
            }
        });
    }
};

