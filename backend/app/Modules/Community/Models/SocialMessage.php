<?php

namespace App\Modules\Community\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use App\Modules\Organization\Models\Organization;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SocialMessage extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $table = 'social_messages';

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'social_conversation_id',
        'direction',
        'platform_message_id',
        'parent_message_id',
        'sender_type',
        'sender_name',
        'message_text',
        'sentiment_score',
        'intent',
        'ai_draft_reply',
        'ai_draft_status',
        'is_hidden_on_platform',
    ];

    protected function casts(): array
    {
        return [
            'sentiment_score' => 'float',
            'is_hidden_on_platform' => 'boolean',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(SocialConversation::class, 'social_conversation_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_message_id', 'platform_message_id');
    }

    public function isInbound(): bool
    {
        return $this->direction === 'inbound';
    }

    public function isOutbound(): bool
    {
        return $this->direction === 'outbound';
    }

    public function isNegative(): bool
    {
        return $this->sentiment_score < -0.20;
    }

    public function isPositive(): bool
    {
        return $this->sentiment_score > 0.20;
    }
}

