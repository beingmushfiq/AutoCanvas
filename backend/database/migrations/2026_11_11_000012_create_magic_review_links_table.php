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
        Schema::create('magic_review_links', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('brand_id')->nullable()->index();
            $table->ulid('content_item_id')->nullable()->index();
            $table->ulid('dispatch_id')->nullable()->index();
            $table->string('token', 64)->unique();
            $table->string('client_name', 128);
            $table->string('client_email', 128)->nullable();
            $table->string('status', 30)->default('active')->index(); // active, approved, changes_requested, expired, revoked
            $table->text('client_feedback')->nullable();
            $table->json('feedback_details')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamp('accessed_at')->nullable();
            $table->timestamp('actioned_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('set null');
            $table->foreign('content_item_id')->references('id')->on('content_items')->onDelete('cascade');
            $table->foreign('dispatch_id')->references('id')->on('publishing_dispatches')->onDelete('set null');
            $table->index(['organization_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('magic_review_links');
    }
};

