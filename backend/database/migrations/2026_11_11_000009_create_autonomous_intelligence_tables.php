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
        // 1. Discovered Sources (Autonomous Related Sources Discovery)
        Schema::create('discovered_sources', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->string('source_type', 32); // 'google_news', 'rss', 'reddit', 'sitemap'
            $table->string('source_name', 255);
            $table->text('source_url');
            $table->text('feed_url');
            $table->unsignedInteger('relevance_score')->default(50); // 0-100
            $table->unsignedInteger('authority_score')->default(50); // 0-100
            $table->timestamp('last_scoured_at')->nullable();
            $table->string('status', 32)->default('active'); // 'active', 'quarantined', 'paused'
            $table->timestamps();

            $table->index(['brand_id', 'status']);
            $table->index(['organization_id', 'workspace_id']);
        });

        // 2. Source Clusters (Entity & Story Momentum Clustering)
        Schema::create('source_clusters', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->string('primary_entity', 191);
            $table->string('cluster_title', 255);
            $table->text('summary')->nullable();
            $table->unsignedInteger('article_count')->default(1);
            $table->unsignedInteger('momentum_score')->default(50); // 0-100
            $table->json('source_domains')->nullable();
            $table->boolean('has_consensus')->default(false);
            $table->timestamp('first_seen_at')->useCurrent();
            $table->timestamp('last_seen_at')->useCurrent();
            $table->timestamps();

            $table->index(['brand_id', 'momentum_score']);
            $table->index(['organization_id', 'primary_entity']);
        });

        // 3. Content Fingerprints (Anti-Duplication Registry)
        Schema::create('content_fingerprints', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->foreignUuid('content_item_id')->nullable()->constrained('content_items')->nullOnDelete();
            $table->string('channel', 32); // 'linkedin', 'instagram', 'facebook', 'twitter'
            $table->unsignedBigInteger('simhash_64'); // 64-bit lexical fingerprint
            $table->text('concept_summary');
            $table->text('hook_text');
            $table->json('embedding_vector')->nullable(); // float array
            $table->string('creative_template_id', 64)->default('minimal_corporate_v1');
            $table->string('color_palette_seed', 32)->nullable();
            $table->timestamp('published_or_scheduled_at')->useCurrent();
            $table->timestamps();

            $table->index(['brand_id', 'channel', 'published_or_scheduled_at'], 'cfp_brand_channel_pub_idx');
            $table->index(['brand_id', 'simhash_64']);
        });

        // 4. Brand Cadence Settings (Autopilot Dispatch Configuration)
        Schema::create('brand_cadence_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('brand_id')->constrained('brands')->cascadeOnDelete()->unique();
            $table->string('autopilot_mode', 32)->default('copilot_manual'); // 'copilot_manual', 'assisted_autopilot', 'full_autonomous'
            $table->json('weekly_schedule'); // Array of target slots
            $table->decimal('novelty_threshold_cosine', 4, 3)->default(0.720);
            $table->unsignedInteger('max_daily_posts_per_channel')->default(2);
            $table->boolean('require_consensus_for_breaking_news')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_cycle_run_at')->nullable();
            $table->timestamps();

            $table->index(['brand_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('brand_cadence_settings');
        Schema::dropIfExists('content_fingerprints');
        Schema::dropIfExists('source_clusters');
        Schema::dropIfExists('discovered_sources');
    }
};
