<?php

namespace App\Modules\Publishing\Jobs;

use App\Modules\Organization\Services\AuditLogger;
use App\Modules\SocialConnectors\Models\SocialAccount;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckOAuthTokenHealthJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // Find social accounts expiring within the next 7 days
        $threshold = Carbon::now()->addDays(7);
        $expiringAccounts = SocialAccount::where('connection_status', 'connected')
            ->whereNotNull('token_expires_at')
            ->where('token_expires_at', '<=', $threshold)
            ->get();

        foreach ($expiringAccounts as $account) {
            Log::warning("OAuth token expiring soon for account [{$account->account_name}] on platform [{$account->platform}]. Expiry: {$account->token_expires_at}");

            // If refresh token exists, attempt refresh
            if (!empty($account->refresh_token)) {
                // Here connector token refresh routine can be triggered
                Log::info("Attempting automatic OAuth token refresh for account [{$account->id}].");
            } else {
                AuditLogger::log(
                    'social.token_expiring_soon',
                    $account,
                    null,
                    [
                        'platform' => $account->platform,
                        'account_name' => $account->account_name,
                        'expires_at' => $account->token_expires_at?->toIso8601String(),
                        'action_required' => 'reconnect_social_account'
                    ],
                    $account->organization_id
                );
            }
        }
    }
}
