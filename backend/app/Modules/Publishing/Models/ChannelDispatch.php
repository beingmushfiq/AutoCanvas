<?php

namespace App\Modules\Publishing\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Organization\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChannelDispatch extends Model
{
    use HasFactory, HasTenantScope, HasUlid;

    protected $table = 'channel_dispatches';

    protected $fillable = [
        'dispatch_id',
        'organization_id',
        'channel',
        'idempotency_key',
        'status',
        'platform_post_id',
        'platform_post_url',
        'error_message',
        'retry_count',
        'first_comment_text',
        'first_comment_status',
        'first_comment_id',
        'first_comment_scheduled_at',
        'locked_at',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'retry_count' => 'integer',
            'first_comment_scheduled_at' => 'datetime',
            'locked_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function dispatch(): BelongsTo
    {
        return $this->belongsTo(PublishingDispatch::class, 'dispatch_id');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
