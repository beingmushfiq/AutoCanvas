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
        // 1. Daily Account & Brand Analytics Snapshots (Time-Series Rollups)
        Schema::create('analytics_snapshots', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUlid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignUlid('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->foreignUlid('social_account_id')->nullable()->constrained('social_accounts')->nullOnDelete();

            $table->string('platform', 50)->default('all'); // facebook, instagram, linkedin, twitter, all
            $table->date('snapshot_date')->index();
            $table->unsignedBigInteger('impressions')->default(0);
            $table->unsignedBigInteger('reach')->default(0);
            $table->unsignedBigInteger('engagements')->default(0);
            $table->unsignedBigInteger('clicks')->default(0);
            $table->unsignedBigInteger('video_views')->default(0);
            $table->integer('net_follower_change')->default(0);
            $table->decimal('engagement_rate', 6, 4)->default(0.0000);
            $table->json('metadata')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(
                ['brand_id', 'social_account_id', 'platform', 'snapshot_date'],
                'uq_analytics_snapshot_period'
            );
            $table->index(['organization_id', 'snapshot_date']);
        });

        // 2. Granular Post-Level Performance Analytics & Attribution
        Schema::create('post_analytics', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUlid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignUlid('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->foreignUlid('content_item_id')->constrained('content_items')->cascadeOnDelete();
            $table->foreignUlid('content_variant_id')->constrained('content_variants')->cascadeOnDelete();
            $table->foreignUlid('content_pillar_id')->nullable()->constrained('content_pillars')->nullOnDelete();
            $table->foreignUlid('social_account_id')->nullable()->constrained('social_accounts')->nullOnDelete();
            $table->foreignUlid('publishing_dispatch_id')->nullable()->constrained('publishing_dispatches')->nullOnDelete();

            $table->string('platform', 50);
            $table->string('platform_post_id')->index();
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('comments_count')->default(0);
            $table->unsignedInteger('shares_count')->default(0);
            $table->unsignedInteger('clicks_count')->default(0);
            $table->unsignedBigInteger('impressions_count')->default(0);
            $table->unsignedBigInteger('reach_count')->default(0);
            $table->decimal('engagement_rate', 6, 4)->default(0.0000);
            $table->timestamp('published_at')->index();
            $table->timestamp('last_polled_at')->nullable();
            $table->json('raw_metrics')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['brand_id', 'content_pillar_id']);
            $table->index(['organization_id', 'published_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_analytics');
        Schema::dropIfExists('analytics_snapshots');
    }
};

