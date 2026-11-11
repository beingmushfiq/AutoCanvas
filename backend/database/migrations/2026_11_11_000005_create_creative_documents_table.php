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
        Schema::create('creative_documents', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUlid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignUlid('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->foreignUlid('content_item_id')->nullable()->constrained('content_items')->nullOnDelete();
            $table->foreignUlid('content_variant_id')->nullable()->constrained('content_variants')->nullOnDelete();
            $table->string('name');
            $table->string('template_id')->default('minimal_corporate_v1');
            $table->string('aspect_ratio', 20)->default('1:1');
            $table->unsignedInteger('width')->default(1080);
            $table->unsignedInteger('height')->default(1080);
            $table->json('layers')->nullable();
            $table->json('background_config')->nullable();
            $table->text('rendered_asset_url')->nullable();
            $table->string('render_status', 50)->default('draft'); // draft, rendering, rendered, failed
            $table->string('render_engine', 50)->default('deterministic_svg_fallback'); // playwright_chromium, deterministic_svg_fallback
            $table->text('error_message')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['brand_id', 'created_at']);
            $table->index(['organization_id', 'render_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('creative_documents');
    }
};

