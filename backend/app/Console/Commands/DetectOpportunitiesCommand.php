<?php

namespace App\Console\Commands;

use App\Modules\Brand\Models\Brand;
use App\Modules\Research\Services\TrendAnalysisService;
use Exception;
use Illuminate\Console\Command;

class DetectOpportunitiesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'research:detect-opportunities {--brand= : Optional brand ID to target}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan fresh industry articles and competitor signals to generate content opportunities';

    /**
     * Execute the console command.
     */
    public function handle(TrendAnalysisService $service): int
    {
        $brandId = $this->option('brand');

        $query = Brand::where('status', 'active');
        if ($brandId) {
            $query->where('id', $brandId);
        }

        $brands = $query->get();
        $this->info("Scanning opportunities for {$brands->count()} active brand(s)...");

        $totalOpps = 0;
        foreach ($brands as $brand) {
            try {
                $opps = $service->detectOpportunities($brand, ['limit' => 3]);
                $totalOpps += $opps->count();
                $this->line(" - [{$brand->name}]: Generated {$opps->count()} opportunity(s)");
            } catch (Exception $e) {
                $this->error(" - [{$brand->name}]: Failed — {$e->getMessage()}");
            }
        }

        $this->info("Opportunity scan complete. Total generated: {$totalOpps}");

        return Command::SUCCESS;
    }
}
