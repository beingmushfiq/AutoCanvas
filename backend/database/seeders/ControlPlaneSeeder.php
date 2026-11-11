<?php

namespace Database\Seeders;

use App\Modules\ControlPlane\Models\SystemSetting;
use Illuminate\Database\Seeder;

class ControlPlaneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'pause_all_automations',
                'value' => false,
                'category' => 'emergency',
                'is_secret' => false,
            ],
            [
                'key' => 'maintenance_mode',
                'value' => false,
                'category' => 'general',
                'is_secret' => false,
            ],
            [
                'key' => 'allow_public_registrations',
                'value' => true,
                'category' => 'auth',
                'is_secret' => false,
            ],
            [
                'key' => 'default_ai_provider',
                'value' => 'gemini',
                'category' => 'ai',
                'is_secret' => false,
            ],
            [
                'key' => 'default_ai_model',
                'value' => 'gemini-1.5-flash',
                'category' => 'ai',
                'is_secret' => false,
            ],
            [
                'key' => 'daily_ai_budget_cap_usd',
                'value' => 100.00,
                'category' => 'ai',
                'is_secret' => false,
            ],
            [
                'key' => 'max_upload_size_mb',
                'value' => 25,
                'category' => 'storage',
                'is_secret' => false,
            ],
            [
                'key' => 'max_concurrent_publishing_jobs',
                'value' => 10,
                'category' => 'publishing',
                'is_secret' => false,
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'category' => $setting['category'],
                    'is_secret' => $setting['is_secret'],
                ]
            );
        }
    }
}

