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
        // 1. Brands (Central Aggregate Root)
        Schema::create('brands', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUlid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('industry')->nullable();
            $table->string('sub_industry')->nullable();
            $table->string('website_url', 500)->nullable();
            $table->enum('status', ['active', 'paused', 'archived'])->default('active');
            $table->json('automation_policy')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['organization_id', 'workspace_id', 'slug']);
            $table->index(['organization_id', 'workspace_id']);
        });

        // 2. Brand Profiles (Business Understanding & Personas)
        Schema::create('brand_profiles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('brand_id')->unique()->constrained('brands')->cascadeOnDelete();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->text('business_description')->nullable();
            $table->text('mission')->nullable();
            $table->text('vision')->nullable();
            $table->text('positioning')->nullable();
            $table->json('products_services')->nullable();
            $table->text('target_audience')->nullable();
            $table->json('personas')->nullable();
            $table->json('geographic_markets')->nullable();
            $table->json('usps')->nullable();
            $table->json('content_objectives')->nullable();
            $table->string('primary_cta')->nullable();
            $table->string('secondary_cta')->nullable();
            $table->json('prohibited_subjects')->nullable();
            $table->json('restricted_claims')->nullable();
            $table->json('publishing_rules')->nullable();
            $table->timestamps();
        });

        // 3. Brand Visual Identities (Deterministic Design Rules)
        Schema::create('brand_visual_identities', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('brand_id')->unique()->constrained('brands')->cascadeOnDelete();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('primary_logo_url', 1000)->nullable();
            $table->string('secondary_logo_url', 1000)->nullable();
            $table->string('monochrome_logo_url', 1000)->nullable();
            $table->string('mark_url', 1000)->nullable();
            $table->string('primary_color', 20)->default('#101828');
            $table->string('secondary_color', 20)->default('#6257E8');
            $table->json('accent_colors')->nullable();
            $table->json('background_colors')->nullable();
            $table->string('primary_font', 100)->default('Inter');
            $table->string('secondary_font', 100)->default('Inter');
            $table->json('typography_hierarchy')->nullable();
            $table->json('layout_preferences')->nullable();
            $table->json('visual_exclusions')->nullable();
            $table->timestamps();
        });

        // 4. Brand Voice Profiles (Tone & Multi-Language Rules)
        Schema::create('brand_voice_profiles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('brand_id')->unique()->constrained('brands')->cascadeOnDelete();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->json('personality_traits')->nullable();
            $table->string('tone')->nullable();
            $table->text('communication_style')->nullable();
            $table->string('preferred_language', 20)->default('en');
            $table->json('channel_language_rules')->nullable();
            $table->enum('formality_level', ['formal', 'casual', 'conversational', 'technical'])->default('conversational');
            $table->json('vocabulary_rules')->nullable();
            $table->timestamps();
        });

        // 5. Brand Assets (Uploaded Logos, Guidelines & Media)
        Schema::create('brand_assets', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUlid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['logo', 'photo', 'illustration', 'icon', 'document', 'other'])->default('logo');
            $table->string('file_path');
            $table->string('file_url', 1000);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->json('dimensions')->nullable();
            $table->json('tags')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['brand_id', 'type']);
        });

        // 6. Brand Memory Entries (Persistent Verified Learnings)
        Schema::create('brand_memory_entries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->enum('category', [
                'approved_fact',
                'successful_style',
                'failed_experiment',
                'audience_insight',
                'campaign_milestone',
            ])->default('approved_fact');
            $table->string('title');
            $table->text('content');
            $table->decimal('confidence_score', 3, 2)->default(1.00);
            $table->json('metadata')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            $table->index(['brand_id', 'category']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('brand_memory_entries');
        Schema::dropIfExists('brand_assets');
        Schema::dropIfExists('brand_voice_profiles');
        Schema::dropIfExists('brand_visual_identities');
        Schema::dropIfExists('brand_profiles');
        Schema::dropIfExists('brands');
    }
};
