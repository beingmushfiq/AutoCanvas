<?php

namespace App\AI\Providers;

use App\AI\Contracts\AIProviderInterface;

class DeterministicMockProvider implements AIProviderInterface
{
    public function getName(): string
    {
        return 'mock';
    }

    public function generateText(string $prompt, array $options = []): array
    {
        $task = $options['task_type'] ?? 'general';

        if ($task === 'brand_discovery') {
            $response = json_encode([
                'mission' => 'Empower sustainable high performance with precision engineering.',
                'vision' => 'To become the global standard for modern, responsible athletic gear.',
                'positioning' => 'Premium, science-backed athletic lifestyle for disciplined professionals.',
                'personality_traits' => ['authoritative', 'inspiring', 'technical', 'disciplined'],
                'tone' => 'Direct, motivational, evidence-based, clean',
                'primary_color' => '#0F172A',
                'secondary_color' => '#E11D48',
                'primary_font' => 'Inter',
                'confidence_scores' => [
                    'mission' => 0.95,
                    'positioning' => 0.92,
                    'tone' => 0.88,
                ],
            ]);
        } elseif ($task === 'content_production') {
            $response = json_encode([
                'title' => 'Autonomous Brand Scale Announcement',
                'concept' => 'Highlighting autonomous brand operations without compromising voice fidelity.',
                'variants' => [
                    'linkedin' => [
                        'caption' => "The traditional trade-off between creative speed and brand integrity is broken.\n\nModern growth demands omnichannel velocity, yet manual quality checks stall deployment.\n\nHere is how autonomous brand operations bridge the gap without losing nuance:\n\n1. Centralized Brand DNA\n2. Real-time Knowledge Retrieval\n3. Deterministic Rendering\n\nWhat is your team's biggest operational bottleneck?",
                        'hashtags' => ['#BrandOperations', '#SaaS', '#B2BGrowth', '#Automation'],
                        'cta_text' => 'Read the Whitepaper',
                        'cta_url' => 'https://example.com/insights',
                    ],
                    'facebook' => [
                        'caption' => "Say goodbye to scattered brand assets and inconsistent copy! 🚀\n\nAutoCanvas helps your team deliver verified, on-brand content across every channel on autopilot. Check out how modern brands are scaling their social presence today.",
                        'hashtags' => ['#AutoCanvas', '#SocialMediaTools', '#MarketingAutomation'],
                        'cta_text' => 'Learn More',
                        'cta_url' => 'https://example.com/demo',
                    ],
                    'instagram' => [
                        'caption' => "Consistency isn't accidental. It's engineered. ✨\n.\n.\nOne brand. Every channel. Always in rhythm.\nTap the link in bio to explore the future of autonomous brand operations.\n.\n.",
                        'hashtags' => ['#BrandDesign', '#VisualIdentity', '#DesignSystems', '#ModernMarketing', '#ScaleYourBrand'],
                        'cta_text' => 'Link in Bio',
                        'cta_url' => 'https://example.com',
                    ],
                ],
                'creative_prompt' => [
                    'headline' => "Consistency Isn't Accidental.",
                    'supporting_text' => 'Autonomous brand operations at enterprise velocity.',
                    'cta' => 'Explore the Platform',
                    'template_id' => 'minimal_corporate_v1',
                ],
            ]);
        } elseif ($task === 'content_qa') {
            // Check if prompt concept / variants contain simulated prohibited violation
            $lowerPrompt = strtolower($prompt);
            $conceptPart = str_contains($lowerPrompt, 'concept:') ? explode('concept:', $lowerPrompt)[1] : '';
            $hasProhibited = str_contains($conceptPart, 'guaranteed 100% returns');

            $response = json_encode([
                'brand_alignment_score' => $hasProhibited ? 45 : 94,
                'platform_fit_score' => $hasProhibited ? 50 : 92,
                'readability_score' => 90,
                'overall_quality_score' => $hasProhibited ? 48 : 92,
                'risk_level' => $hasProhibited ? 'high' : 'low',
                'safety_checks' => [
                    'contains_prohibited_terms' => $hasProhibited,
                    'unsubstantiated_claims' => $hasProhibited,
                    'competitor_mentions' => false,
                ],
                'suggestions' => $hasProhibited ? [
                    'Violates prohibited subject guidelines regarding financial guarantees.',
                    'Rephrase to focus on technology performance rather than speculative returns.',
                ] : [
                    'Hook structure is strong and scannable for B2B audiences.',
                    'Hashtag distribution complies with channel limits.',
                ],
            ]);
        } elseif ($task === 'opportunity_detection') {
            $response = json_encode([
                'opportunities' => [
                    [
                        'title' => 'Autonomous Brand Velocity: Navigating Real-Time Trends Without Noise',
                        'angle' => 'Why reactionary social posting damages brand equity, and how automated intelligence pipelines maintain pillar discipline.',
                        'why_it_matters' => 'Recent industry discussions show brands struggle to balance publishing speed with brand voice fidelity.',
                        'recommended_channels' => ['linkedin', 'facebook', 'instagram'],
                        'urgency_score' => 88,
                        'freshness_score' => 95,
                        'overall_opportunity_score' => 92,
                    ],
                    [
                        'title' => 'Engineering Precision in Modern Digital Storytelling',
                        'angle' => 'Translating technical milestones and product architecture into executive-level thought leadership.',
                        'why_it_matters' => 'Audiences engage 3x more with transparent engineering breakdowns than generic promotional claims.',
                        'recommended_channels' => ['linkedin', 'facebook'],
                        'urgency_score' => 74,
                        'freshness_score' => 86,
                        'overall_opportunity_score' => 80,
                    ],
                ],
            ]);
        } elseif ($task === 'competitor_analysis') {
            $response = json_encode([
                'top_themes' => [
                    ['theme' => 'AI Adoption & Workflow Automation', 'count' => 12],
                    ['theme' => 'Product Engineering Deep-dives', 'count' => 8],
                    ['theme' => 'Customer Case Studies', 'count' => 5],
                ],
                'tactical_takeaway' => 'Competitors are heavily investing in product engineering breakdown posts on LinkedIn, which generate 40% higher comment activity than short link shares.',
            ]);
        } else {
            $response = 'Generated synthesized content based on input prompt.';
        }

        $inputTokens = (int) ceil(strlen($prompt) / 4);
        $outputTokens = (int) ceil(strlen($response) / 4);

        return [
            'text' => $response,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'model' => 'deterministic-mock-v1',
        ];
    }

    public function generateEmbedding(string $text): array
    {
        // Produce a deterministic 8-dimensional normalized pseudo-vector
        $hash = md5($text);
        $vector = [];
        for ($i = 0; $i < 8; $i++) {
            $hex = substr($hash, $i * 4, 4);
            $vector[] = round((hexdec($hex) / 65535) * 2 - 1, 4);
        }

        return [
            'embedding' => $vector,
            'tokens' => (int) ceil(strlen($text) / 4),
            'model' => 'mock-embedding-v1',
        ];
    }
}
