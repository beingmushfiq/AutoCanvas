<?php

namespace App\Modules\Publishing\Services;

class PublishingWorker
{
    public function dispatchJob(array $content, string $destination, string $idempotencyKey)
    {
        // Dispatch the job
        \App\Modules\Publishing\Jobs\PublishingJob::dispatch($content, $destination, $idempotencyKey);
    }
}

