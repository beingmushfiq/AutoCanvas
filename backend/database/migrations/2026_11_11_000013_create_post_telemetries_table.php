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
        Schema::create('post_telemetries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('organization_id')->index();
            $table->ulid('dispatch_id')->index();
            $table->ulid('channel_dispatch_id')->nullable()->index();
            $table->string('channel', 32);
            $table->unsignedInteger('impressions')->default(0);
            $table->unsignedInteger('engagements')->default(0);
            $table->unsignedInteger('likes')->default(0);
            $table->unsignedInteger('comments')->default(0);
            $table->unsignedInteger('shares')->default(0);
            $table->unsignedInteger('clicks')->default(0);
            $table->decimal('engagement_rate', 6, 4)->default(0.0000);
            $table->boolean('is_winning_pattern')->default(false)->index();
            $table->string('checkpoint', 10); // '2h', '24h', '7d'
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('dispatch_id')->references('id')->on('publishing_dispatches')->onDelete('cascade');
            $table->foreign('channel_dispatch_id')->references('id')->on('channel_dispatches')->onDelete('cascade');
            $table->index(['organization_id', 'is_winning_pattern', 'engagement_rate']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_telemetries');
    }
};

