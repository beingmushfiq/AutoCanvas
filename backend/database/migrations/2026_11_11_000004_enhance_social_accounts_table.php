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
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->char('workspace_id', 26)->nullable()->after('organization_id');
            $table->char('brand_id', 26)->nullable()->after('workspace_id');
            $table->string('account_type', 50)->default('page')->after('platform');
            $table->string('account_name', 255)->default('Social Account')->after('account_type');
            $table->text('avatar_url')->nullable()->after('account_name');
            $table->json('scopes')->nullable()->after('expires_at');
            $table->boolean('is_active')->default(true)->after('scopes');
            $table->string('connection_status', 50)->default('connected')->after('is_active');
            $table->json('metadata')->nullable()->after('connection_status');
            $table->timestamp('last_synced_at')->nullable()->after('metadata');

            $table->index(['brand_id', 'platform']);
            $table->index(['organization_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropIndex(['brand_id', 'platform']);
            $table->dropIndex(['organization_id', 'is_active']);
            $table->dropColumn([
                'workspace_id',
                'brand_id',
                'account_type',
                'account_name',
                'avatar_url',
                'scopes',
                'is_active',
                'connection_status',
                'metadata',
                'last_synced_at',
            ]);
        });
    }
};

