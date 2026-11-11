<?php

namespace App\Modules\Community\Models;

use App\Core\Concerns\HasTenantScope;
use App\Core\Concerns\HasUlid;
use App\Modules\Brand\Models\Brand;
use App\Modules\Organization\Models\Organization;
use App\Modules\SocialConnectors\Models\SocialAccount;
use App\Modules\Workspace\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class SocialConversation extends Model
{
    use HasFactory, HasTenantScope, HasUlid, SoftDeletes;

    protected $table = 'social_conversations';

    protected $fillable = [
        'organization_id',
        'workspace_id',
        'brand_id',
        'social_account_id',
        'platform',
        'conversation_type',
        'platform_thread_id',
        'platform_post_id',
        'sender_id',
        'sender_name',
        'sender_avatar_url',
        'status',
        'priority',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
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

    public function socialAccount(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SocialMessage::class, 'social_conversation_id')->orderBy('created_at', 'asc');
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(SocialMessage::class, 'social_conversation_id')->latestOfMany();
    }

    public function isEscalated(): bool
    {
        return $this->status === 'escalated';
    }

    public function isSpam(): bool
    {
        return $this->status === 'spam';
    }
}

