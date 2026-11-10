<?php

namespace App\Modules\ContentProduction\Services;

use App\AI\Gateway\AIGateway;
use App\Models\User;
use App\Modules\Brand\Models\Brand;
use App\Modules\ContentProduction\Models\ContentItem;
use App\Modules\ContentProduction\Models\ContentVariant;
use App\Modules\ContentStrategy\Models\Campaign;
use App\Modules\ContentStrategy\Models\ContentPillar;
use App\Modules\Creative\Services\CreativeRenderingService;
use App\Modules\Knowledge\Services\BrandKnowledgeRetrievalService;
use App\Modules\Organization\Services\AuditLogger;

class ContentGenerationService
{
    public function __construct(
        protected AIGateway $aiGateway,
        protected BrandKnowledgeRetrievalService $retrievalService,
        protected ContentQAService $qaService,
        protected CreativeRenderingService $creativeService
    ) {}

    /**
     * Generate multi-channel post concept, platform variants, and creative assets.
     */
    public function generate(Brand $brand, array $options, ?User $user = null): ContentItem
    {
        $pillarId = $options['content_pillar_id'] ?? null;
        $campaignId = $options['campaign_id'] ?? null;
        $topic = $options['topic'] ?? 'Company Milestone and Value Proposition';
        $platforms = $options['platforms'] ?? ['linkedin', 'facebook', 'instagram'];
        $generateCreative = $options['generate_creative'] ?? true;
        $useKnowledge = $options['use_knowledge'] ?? true;

        $pillar = $pillarId ? ContentPillar::find($pillarId) : null;
        $campaign = $campaignId ? Campaign::find($campaignId) : null;

        // 1. RAG Knowledge Retrieval
        $citations = [];
        if ($useKnowledge) {
            $citations = $this->retrievalService->search($brand, $topic, 3);
        }

        $citationContext = '';
        foreach ($citations as $cit) {
            $citationContext .= "- {$cit['citation']}: \"{$cit['content']}\"\n";
        }

        $linkedinGuideline = $brand->voiceProfile?->channel_language_rules['linkedin']['tone'] ?? 'Professional, thought leadership, scannable spacing, 3-5 hashtags';
        $facebookGuideline = $brand->voiceProfile?->channel_language_rules['facebook']['tone'] ?? 'Conversational, storytelling, clear link CTA';
        $instagramGuideline = $brand->voiceProfile?->channel_language_rules['instagram']['tone'] ?? 'Punchy aesthetic caption, line breaks, 5-15 hashtags';

        // 2. Formulate Context Prompt
        $prompt = <<<PROMPT
Generate a cohesive multi-channel content campaign for:
Brand: {$brand->name}
Industry: {$brand->industry}
Mission: {$brand->profile?->mission}
Positioning: {$brand->profile?->positioning}
Primary CTA: {$brand->profile?->primary_cta}

Tone: {$brand->voiceProfile?->tone}
Formality: {$brand->voiceProfile?->formality_level}
Channel Guidelines:
- LinkedIn: {$linkedinGuideline}
- Facebook: {$facebookGuideline}
- Instagram: {$instagramGuideline}

Content Pillar: {$pillar?->name} ({$pillar?->description})
Campaign: {$campaign?->name} ({$campaign?->objective})
Topic / Brief: {$topic}

Reference Knowledge:
{$citationContext}

Return a valid JSON object matching this schema:
{
  "title": "Post title",
  "concept": "Core concept summary",
  "variants": {
    "linkedin": { "caption": "...", "hashtags": ["#tag1"], "cta_text": "...", "cta_url": "..." },
    "facebook": { "caption": "...", "hashtags": ["#tag1"], "cta_text": "...", "cta_url": "..." },
    "instagram": { "caption": "...", "hashtags": ["#tag1"], "cta_text": "...", "cta_url": "..." }
  },
  "creative_prompt": {
    "headline": "Bold 4-8 word headline",
    "supporting_text": "Supporting takeaway",
    "cta": "Action text",
    "template_id": "minimal_corporate_v1"
  }
}
PROMPT;

        $aiRes = $this->aiGateway->generateText($prompt, [
            'task_type' => 'content_production',
            'organization_id' => $brand->organization_id,
            'brand_id' => $brand->id,
        ]);

        $generated = json_decode($aiRes['text'], true);

        if (! is_array($generated) || ! isset($generated['variants'])) {
            $generated = [
                'title' => $topic,
                'concept' => "Autonomous content update for {$brand->name}",
                'variants' => [
                    'linkedin' => [
                        'caption' => "Scaling operations requires discipline and consistency.\n\nAt {$brand->name}, we believe verified quality matters.",
                        'hashtags' => ['#Leadership', '#Innovation'],
                        'cta_text' => 'Learn More',
                        'cta_url' => $brand->website_url,
                    ],
                    'facebook' => [
                        'caption' => "Exciting updates from {$brand->name}! Check out our latest post.",
                        'hashtags' => ['#Update'],
                        'cta_text' => 'Read More',
                        'cta_url' => $brand->website_url,
                    ],
                    'instagram' => [
                        'caption' => "Elevate your standards with {$brand->name}. ✨",
                        'hashtags' => ['#Brand'],
                        'cta_text' => 'Link in Bio',
                        'cta_url' => $brand->website_url,
                    ],
                ],
                'creative_prompt' => [
                    'headline' => $brand->name,
                    'supporting_text' => 'Always in rhythm.',
                    'cta' => 'Learn More',
                    'template_id' => 'minimal_corporate_v1',
                ],
            ];
        }

        // 3. Render Creative Graphic if requested
        $renderedAsset = null;
        if ($generateCreative && ! empty($generated['creative_prompt'])) {
            $renderedAsset = $this->creativeService->render($brand, [
                'headline' => $generated['creative_prompt']['headline'] ?? $brand->name,
                'supporting_text' => $generated['creative_prompt']['supporting_text'] ?? null,
                'call_to_action' => $generated['creative_prompt']['cta'] ?? null,
                'template_id' => $generated['creative_prompt']['template_id'] ?? 'minimal_corporate_v1',
            ]);
        }

        // 4. Run Automated QA & Risk Evaluation
        $qaReport = $this->qaService->evaluateContent($brand, $generated['variants'], $generated['concept']);

        // 5. Create Content Item
        $contentItem = ContentItem::create([
            'organization_id' => $brand->organization_id,
            'workspace_id' => $brand->workspace_id,
            'brand_id' => $brand->id,
            'content_pillar_id' => $pillarId,
            'campaign_id' => $campaignId,
            'created_by_user_id' => $user?->id,
            'title' => $generated['title'] ?? $topic,
            'concept' => $generated['concept'] ?? $topic,
            'source_context' => [
                'citations' => $citations,
                'topic' => $topic,
                'creative_prompt' => $generated['creative_prompt'] ?? null,
            ],
            'status' => 'draft',
            'risk_level' => $qaReport['risk_level'] ?? 'low',
            'overall_quality_score' => $qaReport['overall_quality_score'] ?? 90,
            'qa_report' => $qaReport,
        ]);

        // 6. Create Platform Variants
        foreach ($platforms as $platformKey) {
            $vData = $generated['variants'][$platformKey] ?? null;
            if (! $vData) {
                continue;
            }

            ContentVariant::create([
                'organization_id' => $brand->organization_id,
                'workspace_id' => $brand->workspace_id,
                'content_item_id' => $contentItem->id,
                'platform' => $platformKey,
                'caption' => $vData['caption'],
                'hashtags' => $vData['hashtags'] ?? [],
                'cta_text' => $vData['cta_text'] ?? null,
                'cta_url' => $vData['cta_url'] ?? null,
                'character_count' => mb_strlen($vData['caption']),
                'media_urls' => $renderedAsset ? [$renderedAsset['file_url']] : [],
                'creative_document' => $renderedAsset['creative_document'] ?? null,
                'quality_score' => $qaReport['platform_fit_score'] ?? 90,
            ]);
        }

        AuditLogger::log('content.generated', $contentItem, null, [
            'title' => $contentItem->title,
            'quality_score' => $contentItem->overall_quality_score,
            'risk_level' => $contentItem->risk_level,
        ], $brand->organization_id, $brand->workspace_id);

        return $contentItem->load(['variants', 'pillar', 'campaign']);
    }
}
