<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('payment_transactions', 'normalized_trx_id')) {
                $table->string('normalized_trx_id', 150)->nullable()->after('transaction_reference');
            }
            if (!Schema::hasColumn('payment_transactions', 'exchange_rate_snapshot')) {
                $table->decimal('exchange_rate_snapshot', 12, 4)->default(120.0000)->after('amount');
            }
            if (!Schema::hasColumn('payment_transactions', 'amount_bdt')) {
                $table->decimal('amount_bdt', 12, 2)->default(0.00)->after('exchange_rate_snapshot');
            }
            if (!Schema::hasColumn('payment_transactions', 'amount_usd')) {
                $table->decimal('amount_usd', 12, 2)->default(0.00)->after('amount_bdt');
            }
        });

        // Populate normalized_trx_id for any existing records
        DB::table('payment_transactions')
            ->whereNull('normalized_trx_id')
            ->update([
                'normalized_trx_id' => DB::raw("UPPER(TRIM(transaction_reference))"),
                'amount_bdt' => DB::raw("amount"),
                'amount_usd' => DB::raw("ROUND(amount / 120.0, 2)"),
            ]);

        // Add unique index on gateway and normalized_trx_id
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->unique(['gateway', 'normalized_trx_id'], 'uq_gateway_normalized_trx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropUnique('uq_gateway_normalized_trx');
            $table->dropColumn(['normalized_trx_id', 'exchange_rate_snapshot', 'amount_bdt', 'amount_usd']);
        });
    }
};
