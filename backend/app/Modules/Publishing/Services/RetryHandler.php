<?php

namespace App\Modules\Publishing\Services;

class RetryHandler
{
    public function handleFailure(\Exception $e, int $attempt)
    {
        // Exponential backoff logic
    }
}

