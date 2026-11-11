<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('intelligence:harvest-and-synthesize')->hourly();
Schedule::command('research:sync-feeds')->hourly();
Schedule::command('research:detect-opportunities')->everyThreeHours();
Schedule::command('social:check-tokens --days=7')->daily();
Schedule::command('publishing:reconcile')->everyFifteenMinutes();
