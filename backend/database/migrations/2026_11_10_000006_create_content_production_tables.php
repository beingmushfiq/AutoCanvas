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
        // 1. Content Pillars
        Schema::create('content_pillars', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('brand_id')->index();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('target_audience')->nullable();
            $table->unsignedTinyInteger('weight_percentage')->default(20);
            $table->string('color_tag', 20)->default('#6257E8');
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('cascade');
        });

        // 2. Marketing & Content Campaigns
        Schema::create('campaigns', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('brand_id')->index();
            $table->ulid('content_pillar_id')->nullable()->index();
            $table->string('name');
            $table->string('slug');
            $table->string('objective', 100)->nullable();
            $table->text('key_messaging')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['planning', 'active', 'completed', 'paused'])->default('planning');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('cascade');
            $table->foreign('content_pillar_id')->references('id')->on('content_pillars')->onDelete('set null');
        });

        // 3. Content Items (Parent Aggregates)
        Schema::create('content_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('brand_id')->index();
            $table->ulid('content_pillar_id')->nullable()->index();
            $table->ulid('campaign_id')->nullable()->index();
            $table->ulid('created_by_user_id')->nullable()->index();
            $table->string('title');
            $table->text('concept');
            $table->json('source_context')->nullable();
            $table->enum('status', ['draft', 'review', 'approved', 'rejected', 'scheduled', 'published'])->default('draft');
            $table->enum('risk_level', ['low', 'medium', 'high', 'critical'])->default('low');
            $table->unsignedTinyInteger('overall_quality_score')->default(0);
            $table->json('qa_report')->nullable();
            $table->text('review_feedback')->nullable();
            $table->ulid('reviewed_by_user_id')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('cascade');
            $table->foreign('content_pillar_id')->references('id')->on('content_pillars')->onDelete('set null');
            $table->foreign('campaign_id')->references('id')->on('campaigns')->onDelete('set null');
            $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('reviewed_by_user_id')->references('id')->on('users')->onDelete('set null');
        });

        // 4. Content Platform Variants
        Schema::create('content_variants', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('content_item_id')->index();
            $table->enum('platform', ['linkedin', 'facebook', 'instagram', 'twitter', 'threads', 'generic']);
            $table->text('caption');
            $table->json('hashtags');
            $table->string('cta_text')->nullable();
            $table->string('cta_url', 500)->nullable();
            $table->unsignedInteger('character_count')->default(0);
            $table->json('media_urls')->nullable();
            $table->json('creative_document')->nullable();
            $table->unsignedTinyInteger('quality_score')->default(0);
            $table->json('platform_options')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('content_item_id')->references('id')->on('content_items')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_variants');
        Schema::dropIfExists('content_items');
        Schema::dropIfExists('campaigns');
        Schema::dropIfExists('content_pillars');
    }
};
