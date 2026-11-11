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
        // 1. Invoices Table
        Schema::create('invoices', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('organization_id', 26);
            $table->string('invoice_number', 50)->unique();
            $table->char('plan_id', 26);
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('BDT');
            $table->date('billing_period_start');
            $table->date('billing_period_end');
            $table->date('due_date');
            $table->enum('status', ['unpaid', 'processing', 'paid', 'void', 'failed'])->default('unpaid');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('plan_id')->references('id')->on('plans');

            $table->index(['organization_id', 'status'], 'idx_inv_org_status');
            $table->index('invoice_number', 'idx_inv_number');
        });

        // 2. Payment Transactions Table (bKash, Nagad, Bank Wire, Manual)
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('invoice_id', 26);
            $table->char('organization_id', 26);
            $table->enum('gateway', ['bkash', 'nagad', 'bank_wire', 'manual']);
            $table->string('transaction_reference', 150); // TrxID
            $table->string('sender_number', 50)->nullable();
            $table->string('gateway_payment_id', 150)->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('BDT');
            $table->string('idempotency_key', 64)->unique();
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->char('verified_by', 26)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->text('notes')->nullable();
            $table->json('gateway_response')->nullable();
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('verified_by')->references('id')->on('users')->onDelete('set null');

            $table->index(['organization_id', 'status'], 'idx_pt_org_status');
            $table->index(['gateway', 'transaction_reference'], 'idx_pt_gateway_ref');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('invoices');
    }
};

