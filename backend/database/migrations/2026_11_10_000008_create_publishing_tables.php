<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publishing_jobs', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organization_id', 26)->index();
            $table->string('idempotency_key')->unique();
            $table->json('content');
            $table->string('destination');
            $table->string('status')->default('pending'); // pending, processing, completed, failed
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        Schema::create('publishing_attempts', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('publishing_job_id', 26)->index();
            $table->integer('attempt_number');
            $table->string('status');
            $table->text('error')->nullable();
            $table->timestamps();

            $table->foreign('publishing_job_id')->references('id')->on('publishing_jobs')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publishing_attempts');
        Schema::dropIfExists('publishing_jobs');
    }
};

