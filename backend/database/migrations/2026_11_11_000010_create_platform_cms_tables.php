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
        // 1. Landing Page & Marketing CMS Blocks
        Schema::create('platform_cms_blocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('block_key', 64)->unique(); // 'hero', 'features', 'comparison', 'pricing', 'faq', 'announcement', 'seo'
            $table->string('title', 255);
            $table->json('content_json');
            $table->boolean('is_active')->default(true);
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('is_active');
        });

        // 2. AI Prompt Foundry & System Prompt Templates
        Schema::create('ai_prompt_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('task_type', 64); // 'content_strategy', 'content_production', 'qa_evaluation', 'inbox_classification', 'inbox_drafting', 'opportunity_detection', 'creative_layout'
            $table->unsignedInteger('version')->default(1);
            $table->longText('prompt_template');
            $table->string('model_override', 64)->nullable();
            $table->decimal('temperature', 3, 2)->default(0.70);
            $table->unsignedInteger('max_tokens')->default(2048);
            $table->boolean('is_active')->default(true);
            $table->string('change_summary', 255)->nullable();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['task_type', 'is_active']);
            $table->index(['task_type', 'version']);
        });

        // 3. Platform White-Label & Custom Theme Overrides
        Schema::create('custom_theme_overrides', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('platform_name', 128)->default('AutoCanvas');
            $table->string('tagline', 255)->nullable()->default('One brand. Every channel. Always in rhythm.');
            $table->string('creator_name', 128)->default('DevCenterPoint');
            $table->string('creator_url', 255)->default('https://devcenterpoint.com');
            $table->text('primary_logo_url')->nullable();
            $table->text('dark_logo_url')->nullable();
            $table->text('favicon_url')->nullable();
            $table->string('primary_color_hex', 32)->nullable();
            $table->string('accent_color_hex', 32)->nullable();
            $table->longText('custom_css')->nullable();
            $table->longText('custom_head_scripts')->nullable();
            $table->json('announcement_banner')->nullable();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_theme_overrides');
        Schema::dropIfExists('ai_prompt_templates');
        Schema::dropIfExists('platform_cms_blocks');
    }
};

