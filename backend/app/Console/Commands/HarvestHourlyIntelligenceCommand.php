<?php

namespace App\Console\Commands;

use App\Modules\Automation\Services\AutonomousAutopilotEngine;
use App\Modules\Brand\Models\Brand;
use Exception;
use Illuminate\Console\Command;

class HarvestHourlyIntelligenceCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'intelligence:harvest-and-synthesize {--brand= : Optional brand ID to target}';

    /**
     * The console command description.
     */
    protected $description = 'Autonomously scour sources, cluster emerging trends, enforce novelty, and fulfill cadence slots';

    /**
     * Execute the console command.
     */
    public function handle(AutonomousAutopilotEngine $engine): int
    {
        $brandId = $this->option('brand');

        $query = Brand::where('status', 'active');
        if ($brandId) {
            $query->where('id', $brandId);
        }

        $brands = $query->get();
        $this->info("Starting hourly autonomous intelligence scouring for {$brands->count()} brand(s)...");

        $totalMinted = 0;
        $totalRejected = 0;

        foreach ($brands as $brand) {
            try {
                $report = $engine->runCycle($brand);
                $minted = $report['posts_minted'] ?? 0;
                $rejected = $report['duplicates_rejected_and_mutated'] ?? 0;
                $status = $report['status'] ?? 'unknown';

                $totalMinted += $minted;
                $totalRejected += $rejected;

                $this->line(" - [{$brand->name}]: Status={$status} | Minted={$minted} | Novelty Mutated={$rejected}");
            } catch (Exception $e) {
                $this->error(" - [{$brand->name}]: Cycle error: {$e->getMessage()}");
            }
        }

        $this->info("Hourly intelligence cycle complete. Total Posts Minted: {$totalMinted} | Duplicates Blocked & Mutated: {$totalRejected}");

        return Command::SUCCESS;
    }
}

