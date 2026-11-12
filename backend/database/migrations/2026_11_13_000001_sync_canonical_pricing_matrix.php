<?php

use App\Modules\ControlPlane\Models\CmsBlock;
use App\Modules\ControlPlane\Services\MasterCmsService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $cmsService = app(MasterCmsService::class);
        $factoryPricing = $cmsService->getFactoryPricing();

        CmsBlock::updateOrCreate(
            ['block_key' => 'pricing'],
            [
                'title' => 'Transparent Tier Pricing Matrix',
                'content_json' => $factoryPricing,
                'is_active' => true,
            ]
        );

        $cmsService->flushPublicCache();
        Cache::forget(MasterCmsService::CACHE_KEY_PUBLIC_CMS);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive
    }
};

