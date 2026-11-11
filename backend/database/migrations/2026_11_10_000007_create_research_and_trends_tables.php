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
        // 1. RSS Feeds
        Schema::create('rss_feeds', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('brand_id')->nullable()->index();
            $table->string('name');
            $table->string('url', 500);
            $table->string('category', 100)->default('industry_news');
            $table->unsignedSmallInteger('fetch_frequency_minutes')->default(60);
            $table->timestamp('last_fetched_at')->nullable();
            $table->enum('status', ['active', 'failing', 'paused'])->default('active');
            $table->unsignedTinyInteger('error_count')->default(0);
            $table->text('last_error')->nullable();
            $table->string('etag', 255)->nullable();
            $table->string('last_modified_header', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('cascade');
        });

        // 2. Feed Articles
        Schema::create('feed_articles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('rss_feed_id')->index();
            $table->string('title', 500);
            $table->string('url', 1000);
            $table->char('url_hash', 64)->index();
            $table->string('author')->nullable();
            $table->text('summary')->nullable();
            $table->longText('content')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->unsignedTinyInteger('relevance_score')->default(0);
            $table->json('topics')->nullable();
            $table->boolean('is_saved')->default(false);
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('rss_feed_id')->references('id')->on('rss_feeds')->onDelete('cascade');

            $table->unique(['workspace_id', 'url_hash'], 'unique_article_per_workspace');
        });

        // 3. Competitor Profiles
        Schema::create('competitor_profiles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('brand_id')->index();
            $table->string('name');
            $table->string('website_url', 500)->nullable();
            $table->json('social_handles')->nullable();
            $table->text('strengths')->nullable();
            $table->text('weaknesses')->nullable();
            $table->string('target_audience')->nullable();
            $table->enum('observation_frequency', ['daily', 'weekly', 'monthly'])->default('weekly');
            $table->enum('status', ['active', 'paused', 'archived'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('cascade');
        });

        // 4. Competitor Observed Posts
        Schema::create('competitor_posts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('competitor_profile_id')->index();
            $table->enum('platform', ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'other'])->default('linkedin');
            $table->string('post_url', 1000)->nullable();
            $table->text('post_text');
            $table->timestamp('published_at')->nullable();
            $table->json('engagement_signals')->nullable();
            $table->json('observed_themes')->nullable();
            $table->string('tone', 50)->nullable();
            $table->text('tactical_takeaway')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('competitor_profile_id')->references('id')->on('competitor_profiles')->onDelete('cascade');
        });

        // 5. Trend Signals
        Schema::create('trend_signals', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('brand_id')->nullable()->index();
            $table->string('topic');
            $table->text('description')->nullable();
            $table->enum('source_type', ['rss', 'competitor', 'industry_radar', 'manual'])->default('rss');
            $table->unsignedTinyInteger('signal_strength')->default(50);
            $table->json('sample_urls')->nullable();
            $table->enum('status', ['active', 'fading', 'archived'])->default('active');
            $table->timestamp('detected_at');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('cascade');
        });

        // 6. Content Opportunities
        Schema::create('content_opportunities', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('workspace_id')->index();
            $table->ulid('brand_id')->index();
            $table->ulid('content_pillar_id')->nullable()->index();
            $table->ulid('feed_article_id')->nullable()->index();
            $table->ulid('trend_signal_id')->nullable()->index();
            $table->string('title', 500);
            $table->text('angle');
            $table->text('why_it_matters');
            $table->json('recommended_channels');
            $table->unsignedTinyInteger('urgency_score')->default(50);
            $table->unsignedTinyInteger('freshness_score')->default(50);
            $table->unsignedTinyInteger('overall_opportunity_score')->default(50);
            $table->enum('status', ['new', 'dismissed', 'converted'])->default('new');
            $table->ulid('converted_content_item_id')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('cascade');
            $table->foreign('content_pillar_id')->references('id')->on('content_pillars')->onDelete('set null');
            $table->foreign('feed_article_id')->references('id')->on('feed_articles')->onDelete('set null');
            $table->foreign('trend_signal_id')->references('id')->on('trend_signals')->onDelete('set null');
            $table->foreign('converted_content_item_id')->references('id')->on('content_items')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_opportunities');
        Schema::dropIfExists('trend_signals');
        Schema::dropIfExists('competitor_posts');
        Schema::dropIfExists('competitor_profiles');
        Schema::dropIfExists('feed_articles');
        Schema::dropIfExists('rss_feeds');
    }
};

