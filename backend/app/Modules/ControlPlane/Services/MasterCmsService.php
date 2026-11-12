<?php

namespace App\Modules\ControlPlane\Services;

use App\Models\User;
use App\Modules\ControlPlane\Models\AiPromptTemplate;
use App\Modules\ControlPlane\Models\CmsBlock;
use App\Modules\ControlPlane\Models\CustomThemeOverride;
use App\Modules\ControlPlane\Models\SystemChangeLog;
use App\Modules\ControlPlane\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

class MasterCmsService
{
    const CACHE_KEY_PUBLIC_CMS = 'autocanvas:cms:public_data';

    /**
     * Get aggregated public marketing CMS content with factory default fallbacks.
     */
    public function getPublicCmsData(): array
    {
        return Cache::remember(self::CACHE_KEY_PUBLIC_CMS, 3600, function () {
            try {
                $blocks = CmsBlock::where('is_active', true)->get()->keyBy('block_key');
            } catch (\Throwable) {
                $blocks = collect();
            }

            try {
                $theme = $this->getThemeOverrides();
            } catch (\Throwable) {
                $theme = null;
            }

            return [
                'branding' => [
                    'platform_name' => $theme->platform_name ?? 'AutoCanvas',
                    'tagline' => $theme->tagline ?? 'One brand. Every channel. Always in rhythm.',
                    'creator_name' => $theme->creator_name ?? 'DevCenterPoint',
                    'creator_url' => $theme->creator_url ?? 'https://devcenterpoint.com',
                    'primary_logo_url' => $theme->primary_logo_url ?? '/brand/logo-horizontal-dark.svg',
                    'dark_logo_url' => $theme->dark_logo_url ?? '/brand/logo-horizontal-dark.svg',
                    'favicon_url' => $theme->favicon_url ?? '/favicon.svg',
                    'primary_color_hex' => $theme->primary_color_hex,
                    'accent_color_hex' => $theme->accent_color_hex,
                    'custom_css' => $theme->custom_css,
                    'custom_head_scripts' => $theme->custom_head_scripts,
                    'announcement_banner' => $theme->announcement_banner,
                ],
                'hero' => $blocks->get('hero')?->content_json ?? $this->getFactoryHero(),
                'features' => $blocks->get('features')?->content_json ?? $this->getFactoryFeatures(),
                'comparison' => $blocks->get('comparison')?->content_json ?? $this->getFactoryComparison(),
                'pricing' => $blocks->get('pricing')?->content_json ?? $this->getFactoryPricing(),
                'faq' => $blocks->get('faq')?->content_json ?? $this->getFactoryFaq(),
                'seo' => $blocks->get('seo')?->content_json ?? $this->getFactorySeo(),
            ];
        });
    }

    /**
     * Update or create a marketing CMS block.
     */
    public function updateBlock(string $blockKey, array $content, string $title, ?User $user = null): CmsBlock
    {
        $block = CmsBlock::updateOrCreate(
            ['block_key' => $blockKey],
            [
                'title' => $title,
                'content_json' => $content,
                'is_active' => true,
                'updated_by' => $user?->id,
            ]
        );

        SystemChangeLog::create([
            'user_id' => $user?->id,
            'entity_type' => 'cms_block',
            'entity_id' => $block->id,
            'action' => 'cms.block_updated',
            'new_values' => ['block_key' => $blockKey, 'title' => $title],
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->userAgent() ?? 'Master CMS Service',
            'created_at' => now(),
        ]);

        $this->flushPublicCache();

        return $block;
    }

    /**
     * Get or create default platform theme overrides.
     */
    public function getThemeOverrides(): CustomThemeOverride
    {
        $theme = CustomThemeOverride::first();
        if (! $theme) {
            $theme = CustomThemeOverride::create([
                'platform_name' => 'AutoCanvas',
                'tagline' => 'One brand. Every channel. Always in rhythm.',
                'creator_name' => 'DevCenterPoint',
                'creator_url' => 'https://devcenterpoint.com',
                'primary_logo_url' => '/brand/logo-horizontal-dark.svg',
                'dark_logo_url' => '/brand/logo-horizontal-dark.svg',
                'favicon_url' => '/favicon.svg',
            ]);
        }

        return $theme;
    }

    /**
     * Update platform white-labeling and theme overrides.
     */
    public function updateThemeOverrides(array $data, ?User $user = null): CustomThemeOverride
    {
        $theme = $this->getThemeOverrides();
        $theme->fill(array_merge($data, ['updated_by' => $user?->id]));
        $theme->save();

        SystemChangeLog::create([
            'user_id' => $user?->id,
            'entity_type' => 'custom_theme_override',
            'entity_id' => $theme->id,
            'action' => 'theme.overrides_updated',
            'new_values' => $data,
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->userAgent() ?? 'Master CMS Service',
            'created_at' => now(),
        ]);

        $this->flushPublicCache();

        return $theme;
    }

    /**
     * Save a new version of an AI system prompt template.
     */
    public function savePromptTemplate(string $taskType, string $template, array $options = [], ?User $user = null): AiPromptTemplate
    {
        // Deactivate previous active version
        AiPromptTemplate::where('task_type', $taskType)->update(['is_active' => false]);

        $latestVersion = AiPromptTemplate::where('task_type', $taskType)->max('version') ?? 0;

        $newPrompt = AiPromptTemplate::create([
            'task_type' => $taskType,
            'version' => $latestVersion + 1,
            'prompt_template' => $template,
            'model_override' => $options['model_override'] ?? null,
            'temperature' => $options['temperature'] ?? 0.70,
            'max_tokens' => $options['max_tokens'] ?? 2048,
            'is_active' => true,
            'change_summary' => $options['change_summary'] ?? 'Version update via Master Prompt Foundry',
            'updated_by' => $user?->id,
        ]);

        SystemChangeLog::create([
            'user_id' => $user?->id,
            'entity_type' => 'ai_prompt_template',
            'entity_id' => $newPrompt->id,
            'action' => 'prompt_foundry.version_created',
            'new_values' => [
                'task_type' => $taskType,
                'version' => $newPrompt->version,
                'model' => $newPrompt->model_override,
            ],
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->userAgent() ?? 'Master Prompt Foundry',
            'created_at' => now(),
        ]);

        return $newPrompt;
    }

    /**
     * Rollback to a specific prompt version.
     */
    public function rollbackPrompt(string $taskType, int $targetVersion, ?User $user = null): AiPromptTemplate
    {
        $target = AiPromptTemplate::where('task_type', $taskType)
            ->where('version', $targetVersion)
            ->firstOrFail();

        AiPromptTemplate::where('task_type', $taskType)->update(['is_active' => false]);
        $target->is_active = true;
        $target->save();

        SystemChangeLog::create([
            'user_id' => $user?->id,
            'entity_type' => 'ai_prompt_template',
            'entity_id' => $target->id,
            'action' => 'prompt_foundry.rollback_activated',
            'new_values' => ['task_type' => $taskType, 'active_version' => $targetVersion],
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->userAgent() ?? 'Master Prompt Foundry',
            'created_at' => now(),
        ]);

        return $target;
    }

    /**
     * Get all CMS blocks, seeding or falling back to factory defaults if missing.
     */
    public function getAllBlocks(): array
    {
        $existing = CmsBlock::all()->keyBy('block_key');

        $keys = [
            'hero' => ['title' => 'Hero Banner & Value Proposition', 'default' => $this->getFactoryHero()],
            'features' => ['title' => 'Core Architectural Features', 'default' => $this->getFactoryFeatures()],
            'comparison' => ['title' => 'Deterministic vs. Generic Comparison', 'default' => $this->getFactoryComparison()],
            'pricing' => ['title' => 'Transparent Tier Pricing Matrix', 'default' => $this->getFactoryPricing()],
            'faq' => ['title' => 'Technical & Enterprise FAQs', 'default' => $this->getFactoryFaq()],
            'seo' => ['title' => 'Search & Answer Engine Discovery (SEO/AEO/GEO)', 'default' => $this->getFactorySeo()],
        ];

        $result = [];
        foreach ($keys as $key => $meta) {
            $block = $existing->get($key);
            $result[$key] = [
                'id' => $block?->id,
                'block_key' => $key,
                'title' => $block?->title ?? $meta['title'],
                'content_json' => $block?->content_json ?? $meta['default'],
                'is_active' => $block?->is_active ?? true,
                'is_customized' => $block !== null,
                'updated_at' => $block?->updated_at?->toIso8601String() ?? null,
            ];
        }

        return $result;
    }

    /**
     * List all prompt templates with history and defaults.
     */
    public function getPromptTemplates(): array
    {
        $defaultPrompts = [
            'headline_hook' => [
                'template' => "You are a master brand copywriter. Formulate an electric, highly engaging headline and opening hook for the topic: {topic}.\nTarget audience: {audience}.\nTone: {tone}.\nStrict Rules:\n1. Zero cliché tropes (no 'in today's fast-paced world', no 'game-changer').\n2. Open with an immediate tension, provocative observation, or concrete metric.\n3. Keep under 140 characters.",
                'model' => 'gpt-4o',
                'temperature' => 0.70,
                'max_tokens' => 300,
            ],
            'linkedin_carousel' => [
                'template' => "You are an executive LinkedIn strategist. Produce a 7-slide carousel breakdown of {topic}.\nSlide 1: Contrarian hook that challenges conventional wisdom.\nSlides 2-5: Tactical insight with step-by-step framework and metrics.\nSlide 6: Architectural recap diagram/list.\nSlide 7: Conversation starter asking for industry perspective.",
                'model' => 'gpt-4o',
                'temperature' => 0.65,
                'max_tokens' => 1500,
            ],
            'x_thread' => [
                'template' => "Craft a high-velocity, insight-dense Twitter/X thread about {topic}.\nTweet 1: Scroll-stopping hook + premise.\nTweets 2-5: Bite-sized, actionable takeaways with bullet points.\nTweet 6: Synthesis and call to bookmark/retweet.",
                'model' => 'gpt-4o-mini',
                'temperature' => 0.70,
                'max_tokens' => 800,
            ],
            'brand_voice_extractor' => [
                'template' => "Analyze the provided text samples and extract a comprehensive Brand Voice Matrix:\n1. Primary Tone (e.g., authoritative, warm, analytical, contrarian).\n2. Sentence Rhythm (e.g., staccato, conversational, academic).\n3. Vocabulary Lexicon (signature phrases to use, forbidden buzzwords).\n4. Emotional Resonance and Audience Framing.",
                'model' => 'claude-3-5-sonnet',
                'temperature' => 0.30,
                'max_tokens' => 1200,
            ],
            'image_layout_director' => [
                'template' => "You are an editorial art director. Given the copy: {caption}, generate deterministic SVG/HTML layout styling directives.\nOutput format:\n- Background theme: dark obsidian / light editorial\n- Font pairing: display serif / geometric sans\n- Accent placement: amber focal badge / hairline split rule\n- Graphic aspect ratio: 1:1 square or 4:5 vertical portrait.",
                'model' => 'gpt-4o',
                'temperature' => 0.40,
                'max_tokens' => 600,
            ],
            'opportunity_radar' => [
                'template' => "Synthesize these harvested market signals and articles: {articles}.\nIdentify the single most urgent, high-leverage content opportunity.\nOutput:\n1. Core Momentum Topic\n2. The Consensus Narrative (what everyone else is saying)\n3. The Contrarian Angle (how our brand stands apart)\n4. Immediate Hook Draft.",
                'model' => 'gemini-1.5-pro',
                'temperature' => 0.50,
                'max_tokens' => 1000,
            ],
            'community_reply' => [
                'template' => "You are responding on behalf of the brand to this comment: \"{comment}\".\nBrand Voice: {brand_voice}.\nRules:\n- Be helpful, conversational, and direct.\n- Never use canned corporate speak like 'Thank you for your valuable feedback'.\n- Add a thoughtful follow-up question or practical tip.",
                'model' => 'gpt-4o-mini',
                'temperature' => 0.60,
                'max_tokens' => 400,
            ],
            'social_rephrase' => [
                'template' => "Adapt the following core thought for {platform}:\n\"{source_text}\"\nStrictly follow {platform} culture, line breaks, hashtag density, and tone.\nPreserve the underlying factual insight while feeling 100% native.",
                'model' => 'gpt-4o',
                'temperature' => 0.60,
                'max_tokens' => 600,
            ],
        ];

        // Seed any missing task types with initial version 1
        foreach ($defaultPrompts as $taskType => $meta) {
            $exists = AiPromptTemplate::where('task_type', $taskType)->exists();
            if (! $exists) {
                AiPromptTemplate::create([
                    'task_type' => $taskType,
                    'version' => 1,
                    'prompt_template' => $meta['template'],
                    'model_override' => $meta['model'],
                    'temperature' => $meta['temperature'],
                    'max_tokens' => $meta['max_tokens'],
                    'is_active' => true,
                    'change_summary' => 'Factory default system prompt initialisation',
                ]);
            }
        }

        $all = AiPromptTemplate::orderBy('task_type')->orderBy('version', 'desc')->get();
        $grouped = [];

        foreach ($all as $item) {
            if (! isset($grouped[$item->task_type])) {
                $grouped[$item->task_type] = [
                    'task_type' => $item->task_type,
                    'active_version' => null,
                    'versions' => [],
                ];
            }
            if ($item->is_active) {
                $grouped[$item->task_type]['active_version'] = $item;
            }
            $grouped[$item->task_type]['versions'][] = $item;
        }

        return array_values($grouped);
    }

    /**
     * Get crawler and novelty tuning settings.
     */
    public function getCrawlerTuning(): array
    {
        $settings = SystemSetting::where('category', 'crawler_novelty')->get()->keyBy('key');

        return [
            'simhash_hamming_cutoff' => (int) ($settings->get('simhash_hamming_cutoff')?->value ?? 4),
            'vector_cosine_cutoff' => (float) ($settings->get('vector_cosine_cutoff')?->value ?? 0.72),
            'scrape_interval_minutes' => (int) ($settings->get('scrape_interval_minutes')?->value ?? 60),
            'freshness_window_hours' => (int) ($settings->get('freshness_window_hours')?->value ?? 72),
            'max_articles_per_cluster' => (int) ($settings->get('max_articles_per_cluster')?->value ?? 10),
            'auto_publish_threshold' => (float) ($settings->get('auto_publish_threshold')?->value ?? 0.85),
            'discovery_enabled' => (bool) ($settings->get('discovery_enabled')?->value ?? true),
        ];
    }

    /**
     * Update crawler and novelty tuning settings.
     */
    public function updateCrawlerTuning(array $data, ?User $user = null): array
    {
        $allowed = [
            'simhash_hamming_cutoff' => 'integer',
            'vector_cosine_cutoff' => 'float',
            'scrape_interval_minutes' => 'integer',
            'freshness_window_hours' => 'integer',
            'max_articles_per_cluster' => 'integer',
            'auto_publish_threshold' => 'float',
            'discovery_enabled' => 'boolean',
        ];

        foreach ($allowed as $key => $type) {
            if (array_key_exists($key, $data)) {
                $val = $data[$key];
                if ($type === 'integer') $val = (int) $val;
                if ($type === 'float') $val = (float) $val;
                if ($type === 'boolean') $val = (bool) $val;

                SystemSetting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => $val,
                        'category' => 'crawler_novelty',
                        'is_secret' => false,
                        'updated_by' => $user?->id,
                    ]
                );
            }
        }

        SystemChangeLog::create([
            'user_id' => $user?->id,
            'entity_type' => 'crawler_tuning',
            'entity_id' => 'system',
            'action' => 'crawler.tuning_updated',
            'new_values' => $data,
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->userAgent() ?? 'Master Crawler Tuner',
            'created_at' => now(),
        ]);

        return $this->getCrawlerTuning();
    }

    public function flushPublicCache(): void
    {
        Cache::forget(self::CACHE_KEY_PUBLIC_CMS);
    }

    // --- Factory Default CMS Content (Always available out-of-the-box) ---

    protected function getFactoryHero(): array
    {
        return [
            'badge' => 'Engineered by DevCenterPoint',
            'headline_line1' => 'One Brand. Every Channel.',
            'headline_line2' => 'Always in Rhythm.',
            'subtitle' => 'The all-in-one social media and brand publishing engine. Discovers breaking news, detects trending topics, guarantees original content, and schedules posts automatically.',
            'primary_cta_text' => 'Launch AutoCanvas Workspace',
            'primary_cta_link' => '#auth',
            'secondary_cta_text' => 'Try Live Demo',
            'secondary_cta_link' => '/workspace/overview',
            'metrics_banner' => [
                ['label' => 'Real-Time News Monitoring', 'value' => '24/7/365'],
                ['label' => 'Guaranteed Duplicate Prevention', 'value' => '100%'],
                ['label' => 'Studio Brand Quality', 'value' => 'WCAG 2.2 AA'],
            ],
        ];
    }

    protected function getFactoryFeatures(): array
    {
        return [
            'section_title' => 'Built for High-Growth Brands and Agencies',
            'section_kicker' => 'ORIGINALITY OVER GENERIC CONTENT',
            'items' => [
                [
                    'title' => 'Real-Time News Discovery',
                    'description' => 'Discovers related Google News feeds, Reddit discussions, and industry publication sitemaps every 60 minutes.',
                    'pill' => 'Automated',
                    'icon' => 'Compass',
                ],
                [
                    'title' => 'Guaranteed Duplicate Prevention',
                    'description' => 'Multi-tier checks catch repeated phrases and identical ideas, keeping every post fresh across 180 days of history.',
                    'pill' => 'Guaranteed',
                    'icon' => 'ShieldCheck',
                ],
                [
                    'title' => 'Studio Visual Brand Designer',
                    'description' => 'No garbled text or distorted images. AutoCanvas generates crisp, high-resolution graphics with your exact brand fonts and colors.',
                    'pill' => 'Studio Quality',
                    'icon' => 'Palette',
                ],
                [
                    'title' => 'Multi-Channel Native Adaptation',
                    'description' => 'Tailored hooks, hashtags, and formatting for LinkedIn, Instagram, Facebook, and Twitter without lazy cross-posting.',
                    'pill' => 'Channel Native',
                    'icon' => 'Share2',
                ],
            ],
        ];
    }

    protected function getFactoryComparison(): array
    {
        return [
            'section_title' => 'AutoCanvas vs. Generic AI Tools',
            'rows' => [
                [
                    'capability' => 'Content Repetition',
                    'autocanvas' => 'Guaranteed Duplicate Prevention (Phrase, Concept & Design Rotation)',
                    'generic_tools' => 'Repeats the same generic tropes and questions every few days',
                ],
                [
                    'capability' => 'Creative Graphic Quality',
                    'autocanvas' => 'Crisp brand typography, exact colors, and pixel-perfect graphic layouts',
                    'generic_tools' => 'Garbled AI raster text and generic distorted visuals',
                ],
                [
                    'capability' => 'Source Intelligence',
                    'autocanvas' => 'Hourly industry news monitoring, trending topic discovery, and verified facts',
                    'generic_tools' => 'Zero live industry grounding; hallucinations',
                ],
            ],
        ];
    }

    protected function getFactoryPricing(): array
    {
        return [
            'section_title' => 'Transparent, Simple Subscriptions',
            'currency_bdt_rate' => 120, // 1 USD = 120 BDT
            'tiers' => [
                [
                    'id' => 'starter',
                    'name' => 'Starter',
                    'monthly_price_usd' => 29,
                    'annual_price_usd' => 24,
                    'description' => 'Essential brand publishing for solo founders and single businesses.',
                    'features' => [
                        '1 Managed Brand',
                        '1 Workspace',
                        '3 Connected Channels',
                        '2 Team Members',
                        '500k AI Tokens / mo',
                        '50 Renders / mo',
                        'Core Publishing Calendar',
                        'Duplicate Post Prevention',
                    ],
                    'highlighted' => false,
                ],
                [
                    'id' => 'growth',
                    'name' => 'Growth',
                    'monthly_price_usd' => 79,
                    'annual_price_usd' => 65,
                    'description' => 'Continuous rhythm and news intelligence for expanding brands.',
                    'features' => [
                        '5 Managed Brands',
                        '3 Workspaces',
                        '10 Connected Channels',
                        '8 Team Members',
                        '2.5M AI Tokens / mo',
                        '300 Renders / mo',
                        'Real-Time News & Trend Radar',
                        'Studio Brand Graphic Designer',
                        'Safe Double-Post Protection',
                    ],
                    'highlighted' => true,
                ],
                [
                    'id' => 'agency',
                    'name' => 'Agency Pro',
                    'monthly_price_usd' => 199,
                    'annual_price_usd' => 165,
                    'description' => 'High-velocity multi-brand operating system for marketing agencies.',
                    'features' => [
                        '25 Managed Brands',
                        '10 Workspaces',
                        '50 Connected Channels',
                        '30 Team Members',
                        '10M AI Tokens / mo',
                        '2,000 Renders / mo',
                        'Brand Voice & Style Memory',
                        'Unified Social Inbox & Engagement',
                        'Priority Queue Worker Dispatches',
                    ],
                    'highlighted' => false,
                ],
                [
                    'id' => 'enterprise',
                    'name' => 'Enterprise',
                    'monthly_price_usd' => 499,
                    'annual_price_usd' => 415,
                    'description' => 'Custom limits, dedicated infrastructure, and local payment invoicing.',
                    'features' => [
                        '100 Managed Brands',
                        '50 Workspaces',
                        '250 Connected Channels',
                        '100 Team Members',
                        '50M AI Tokens / mo',
                        '10,000 Renders / mo',
                        'Full Platform Admin Center Access',
                        'Dedicated IP & Webhook Relays',
                        'Local Payment Invoicing (bKash/Nagad/Bank Wire)',
                        'Direct Engineering SLA by DevCenterPoint',
                    ],
                    'highlighted' => false,
                    'contact_sales' => true,
                ],
            ],
        ];
    }

    protected function getFactoryFaq(): array
    {
        return [
            'section_title' => 'Frequently Answered Inquiries',
            'items' => [
                [
                    'question' => 'How does AutoCanvas guarantee that content is never a duplicate?',
                    'answer' => 'AutoCanvas uses a 3-tier duplicate prevention system. Tier 1 catches and rewrites repeated phrases. Tier 2 analyzes the core idea against 180 days of your past posts to ensure the angle is genuinely fresh. Tier 3 rotates visual layouts and color schemes. If an idea is too similar to past work, AutoCanvas automatically refreshes it with a new angle or actionable takeaway.',
                ],
                [
                    'question' => 'What is the role of DevCenterPoint in AutoCanvas?',
                    'answer' => 'AutoCanvas is engineered, architected, and maintained by DevCenterPoint (https://devcenterpoint.com). DevCenterPoint provides enterprise architecture, cloud infrastructure, local payment integration, and ongoing autonomous AI systems engineering.',
                ],
                [
                    'question' => 'Can I pay locally via bKash, Nagad, Rocket or Bank Wire?',
                    'answer' => 'Yes. AutoCanvas includes a dedicated local billing engine supporting instant offline transaction submissions for bKash, Nagad, Rocket, and direct Bangladeshi bank transfers with instant invoice generation.',
                ],
            ],
        ];
    }

    public function getFactorySeo(): array
    {
        return [
            'meta_title' => 'AutoCanvas — Autonomous Social Media Management & Creative Studio',
            'meta_description' => 'Enterprise-grade multi-tenant social media management platform featuring deterministic AI creative generation, multi-brand workspace isolation, and idempotent cross-platform publishing.',
            'meta_keywords' => 'AI social media management, multi-brand social publishing, social media scheduling, agency approval workflow, deterministic AI graphics, AutoCanvas, DevCenterPoint',
            'canonical_url' => config('app.url', 'https://autocanvas.devcenterpoint.com'),
            'og_image_url' => '/brand/og-share.png',
            'twitter_handle' => '@devcenterpoint',
            'robots_policy' => 'index, follow',
            'schema_organization_name' => 'AutoCanvas',
            'schema_organization_url' => config('app.url', 'https://autocanvas.devcenterpoint.com'),
            'schema_logo_url' => '/brand/logo.svg',
            'social_profiles' => [
                'https://www.linkedin.com/company/devcenterpoint',
                'https://twitter.com/devcenterpoint',
            ],
        ];
    }
}
