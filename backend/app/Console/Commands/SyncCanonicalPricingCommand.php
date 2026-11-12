<?php

namespace App\Console\Commands;

use App\Modules\ControlPlane\Models\CmsBlock;
use App\Modules\ControlPlane\Services\MasterCmsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SyncCanonicalPricingCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'cms:sync-pricing {--force : Force overwrite even if customized}';

    /**
     * The console command description.
     */
    protected $description = 'Synchronize public landing page pricing to official 4-tier matrix and flush cache';

    /**
     * Execute the console command.
     */
    public function handle(MasterCmsService $cmsService): int
    {
        $this->info('Synchronizing pricing tiers to official platform canonical matrix...');

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

        $this->newLine();
        $this->info('✅ Official 4-tier pricing matrix active:');

        $headers = ['Plan', 'Monthly ($)', 'Annual / Mo ($)', 'Highlight', 'Sales CTA'];
        $rows = [];
        foreach ($factoryPricing['tiers'] as $tier) {
            $rows[] = [
                $tier['name'],
                '$' . $tier['monthly_price_usd'],
                '$' . $tier['annual_price_usd'],
                !empty($tier['highlighted']) ? '⭐ MOST POPULAR' : '—',
                !empty($tier['contact_sales']) ? '📞 Contact Sales' : '—',
            ];
        }

        $this->table($headers, $rows);

        $this->info('🚀 Public CMS cache flushed. Landing page instantly displays the updated tiers.');

        return Command::SUCCESS;
    }
}

