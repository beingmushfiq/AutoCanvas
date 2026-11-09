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
        // 1. Knowledge Sources
        Schema::create('knowledge_sources', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUlid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignUlid('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->enum('source_type', ['website_url', 'pdf', 'docx', 'txt', 'csv', 'raw_text']);
            $table->string('display_name');
            $table->text('original_uri')->nullable();
            $table->char('content_fingerprint', 64)->index();
            $table->enum('credibility', ['A', 'B', 'C', 'D', 'E'])->default('A');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->json('citation_metadata')->nullable();
            $table->timestamps();

            $table->index(['brand_id', 'status']);
        });

        // 2. Source Chunks (for RAG semantic & keyword search)
        Schema::create('source_chunks', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('knowledge_source_id')->constrained('knowledge_sources')->cascadeOnDelete();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUlid('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->unsignedInteger('chunk_index');
            $table->longText('content');
            $table->unsignedInteger('token_count')->default(0);
            $table->json('embedding')->nullable();
            $table->timestamps();

            $table->index(['brand_id', 'organization_id']);
        });

        // 3. AI Usage Records (Metering & Token Accounting)
        Schema::create('ai_usage_records', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUlid('workspace_id')->nullable()->constrained('workspaces')->nullOnDelete();
            $table->foreignUlid('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->foreignUlid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider', 50);
            $table->string('model', 100);
            $table->string('task_type', 100);
            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);
            $table->unsignedInteger('image_count')->default(0);
            $table->decimal('estimated_cost_usd', 10, 6)->default(0.000000);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['organization_id', 'created_at']);
            $table->index(['brand_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_usage_records');
        Schema::dropIfExists('source_chunks');
        Schema::dropIfExists('knowledge_sources');
    }
};
