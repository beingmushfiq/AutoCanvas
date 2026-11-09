<?php

namespace Database\Seeders;

use App\Modules\Billing\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'price_monthly' => 29.00,
                'price_yearly' => 290.00,
                'features' => [
                    'max_workspaces' => 1,
                    'max_brands' => 1,
                    'max_social_accounts' => 3,
                    'max_members' => 2,
                    'monthly_ai_tokens' => 50000,
                    'monthly_renders' => 100,
                    'auto_publish_allowed' => false,
                    'community_inbox_enabled' => true,
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Growth',
                'slug' => 'growth',
                'price_monthly' => 79.00,
                'price_yearly' => 790.00,
                'features' => [
                    'max_workspaces' => 3,
                    'max_brands' => 3,
                    'max_social_accounts' => 10,
                    'max_members' => 5,
                    'monthly_ai_tokens' => 200000,
                    'monthly_renders' => 500,
                    'auto_publish_allowed' => true,
                    'community_inbox_enabled' => true,
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Agency',
                'slug' => 'agency',
                'price_monthly' => 199.00,
                'price_yearly' => 1990.00,
                'features' => [
                    'max_workspaces' => 10,
                    'max_brands' => 10,
                    'max_social_accounts' => 30,
                    'max_members' => 15,
                    'monthly_ai_tokens' => 1000000,
                    'monthly_renders' => 2500,
                    'auto_publish_allowed' => true,
                    'community_inbox_enabled' => true,
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'price_monthly' => 499.00,
                'price_yearly' => 4990.00,
                'features' => [
                    'max_workspaces' => 999,
                    'max_brands' => 999,
                    'max_social_accounts' => 999,
                    'max_members' => 999,
                    'monthly_ai_tokens' => 10000000,
                    'monthly_renders' => 25000,
                    'auto_publish_allowed' => true,
                    'community_inbox_enabled' => true,
                ],
                'is_active' => true,
            ],
        ];

        foreach ($plans as $planData) {
            Plan::updateOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }
    }
}
