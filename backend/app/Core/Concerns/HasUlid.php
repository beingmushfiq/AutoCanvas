<?php

namespace App\Core\Concerns;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

trait HasUlid
{
    use HasUlids;

    /**
     * Get the auto-incrementing flag for the model.
     */
    public function getIncrementing(): bool
    {
        return false;
    }

    /**
     * Get the primary key type.
     */
    public function getKeyType(): string
    {
        return 'string';
    }
}
