<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organization_id', 26)->index();
            $table->char('social_account_id', 26)->index();
            $table->string('provider_comment_id');
            $table->text('text');
            $table->string('author_name');
            $table->string('sentiment')->nullable();
            $table->string('status')->default('new'); // new, replied, dismissed
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('social_account_id')->references('id')->on('social_accounts')->onDelete('cascade');
        });

        Schema::create('metrics', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organization_id', 26)->index();
            $table->char('social_account_id', 26)->index();
            $table->string('metric_name');
            $table->float('value');
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('social_account_id')->references('id')->on('social_accounts')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics');
        Schema::dropIfExists('comments');
    }
};

