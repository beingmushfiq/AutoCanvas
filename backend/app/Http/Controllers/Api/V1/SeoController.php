<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Models\CmsBlock;
use App\Modules\ControlPlane\Services\MasterCmsService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SeoController extends Controller
{
    public function __construct(
        protected MasterCmsService $cmsService
    ) {}

    /**
     * Serve landing page or canonical subpage with server-side pre-injected SEO metadata and JSON-LD structured data.
     * Implements Hybrid Pre-Injection for maximum crawler indexation on cPanel zero-Node hosting.
     */
    public function landingPage(Request $request, ?string $subpath = null): Response
    {
        $cmsData = $this->cmsService->getPublicCmsData();
        $seo = $cmsData['seo'] ?? $this->cmsService->getFactorySeo();
        $faq = $cmsData['faq']['items'] ?? [];

        $spaIndex = public_path('index.html');
        $html = file_exists($spaIndex)
            ? file_get_contents($spaIndex)
            : '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>AutoCanvas</title></head><body><div id="root"></div></body></html>';

        $baseUrl = rtrim(config('app.url', 'https://autocanvas.devcenterpoint.com'), '/');

        // Subpage metadata customization matrix
        $subpageMeta = [
            'pricing' => [
                'title' => 'Pricing & Subscriptions — AutoCanvas',
                'description' => 'Transparent subscription tiers for agencies and brand creators. Multi-tenant workspaces, deterministic AI studio, and local BDT & USD invoicing.',
                'path' => '/pricing',
            ],
            'features/creative-studio' => [
                'title' => 'Deterministic Creative Studio — AutoCanvas',
                'description' => 'Pixel-perfect vector graphic rendering powered by headless Chromium and SVG templates. Prevent AI distortions in brand typography and logos.',
                'path' => '/features/creative-studio',
            ],
            'features/publishing-calendar' => [
                'title' => 'Publishing Calendar & Scheduling — AutoCanvas',
                'description' => 'Autonomous multi-network publishing calendar for Meta (Facebook & Instagram) and LinkedIn Company Pages with idempotent queue dispatch.',
                'path' => '/features/publishing-calendar',
            ],
            'solutions/agencies' => [
                'title' => 'Social Media Management for Agencies — AutoCanvas',
                'description' => 'Scale agency operations with isolated client brand workspaces, one-click external review links, and multi-tenant publishing governance.',
                'path' => '/solutions/agencies',
            ],
            'docs' => [
                'title' => 'Platform Documentation & Architecture — AutoCanvas',
                'description' => 'Comprehensive developer, architect, and operator documentation for the AutoCanvas social media management platform.',
                'path' => '/docs',
            ],
            'terms' => [
                'title' => 'Terms of Service — AutoCanvas',
                'description' => 'Terms of service, platform usage policies, and service level agreements for AutoCanvas.',
                'path' => '/terms',
            ],
            'privacy' => [
                'title' => 'Privacy Policy & Data Protection — AutoCanvas',
                'description' => 'Enterprise privacy guarantees, GDPR compliance, strict tenant data isolation, and cryptographic credential handling.',
                'path' => '/privacy',
            ],
        ];

        $currentSub = $subpath ?? trim($request->path(), '/');
        $currentConfig = $subpageMeta[$currentSub] ?? null;

        $pageTitle = $currentConfig
            ? $currentConfig['title']
            : ($seo['meta_title'] ?? 'AutoCanvas — Autonomous Social Media Management & Creative Studio');

        $pageDescription = $currentConfig
            ? $currentConfig['description']
            : ($seo['meta_description'] ?? 'Enterprise-grade multi-tenant social media management platform.');

        $canonicalUrl = $currentConfig
            ? "{$baseUrl}{$currentConfig['path']}"
            : rtrim($seo['canonical_url'] ?? $baseUrl, '/').'/';

        $title = htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8');
        $description = htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8');
        $keywords = htmlspecialchars($seo['meta_keywords'] ?? 'AI social media management, multi-brand social publishing', ENT_QUOTES, 'UTF-8');
        $ogImage = htmlspecialchars(str_starts_with($seo['og_image_url'] ?? '', 'http') ? $seo['og_image_url'] : $baseUrl.($seo['og_image_url'] ?? '/brand/og-share.png'), ENT_QUOTES, 'UTF-8');
        $twitterHandle = htmlspecialchars($seo['twitter_handle'] ?? '@devcenterpoint', ENT_QUOTES, 'UTF-8');
        $robotsPolicy = htmlspecialchars($seo['robots_policy'] ?? 'index, follow', ENT_QUOTES, 'UTF-8');

        // Build Schema.org Graph
        $schemaGraph = [
            '@context' => 'https://schema.org',
            '@graph' => [
                [
                    '@type' => 'Organization',
                    '@id' => "{$baseUrl}/#organization",
                    'name' => $seo['schema_organization_name'] ?? 'AutoCanvas',
                    'url' => $baseUrl,
                    'logo' => [
                        '@type' => 'ImageObject',
                        '@id' => "{$baseUrl}/#logo",
                        'url' => str_starts_with($seo['schema_logo_url'] ?? '', 'http') ? $seo['schema_logo_url'] : "{$baseUrl}/brand/logo.svg",
                        'caption' => 'AutoCanvas Social Media Platform Logo',
                    ],
                    'parentOrganization' => [
                        '@type' => 'Organization',
                        'name' => 'DevCenterPoint',
                        'url' => 'https://devcenterpoint.com',
                    ],
                    'sameAs' => $seo['social_profiles'] ?? [
                        'https://www.linkedin.com/company/devcenterpoint',
                        'https://twitter.com/devcenterpoint',
                    ],
                    'contactPoint' => [
                        '@type' => 'ContactPoint',
                        'contactType' => 'customer support',
                        'email' => 'hello@devcenterpoint.com',
                    ],
                ],
                [
                    '@type' => 'WebSite',
                    '@id' => "{$baseUrl}/#website",
                    'url' => $baseUrl,
                    'name' => 'AutoCanvas — Autonomous Social Media Management',
                    'publisher' => ['@id' => "{$baseUrl}/#organization"],
                    'inLanguage' => 'en-US',
                ],
                [
                    '@type' => 'SoftwareApplication',
                    '@id' => "{$baseUrl}/#software",
                    'name' => 'AutoCanvas',
                    'operatingSystem' => 'All (Web-based Cloud SaaS)',
                    'applicationCategory' => 'BusinessApplication',
                    'applicationSubCategory' => 'Social Media Management & Publishing Software',
                    'description' => $seo['meta_description'] ?? 'Autonomous social media management platform.',
                    'publisher' => ['@id' => "{$baseUrl}/#organization"],
                    'featureList' => [
                        'Multi-Tenant Agency & Brand Workspaces',
                        'Deterministic Chromium-Composited AI Creative Studio',
                        'Multi-Network Scheduled Publishing (Facebook, Instagram, LinkedIn)',
                        'Granular Client Approval Workflows & Public Review Links',
                        'Unified Social Media Inbox & Engagement Hub',
                        'Cross-Platform Engagement Analytics',
                    ],
                ],
            ],
        ];

        // BreadcrumbList for subpages
        if ($currentConfig) {
            $schemaGraph['@graph'][] = [
                '@type' => 'BreadcrumbList',
                'itemListElement' => [
                    [
                        '@type' => 'ListItem',
                        'position' => 1,
                        'name' => 'Home',
                        'item' => $baseUrl,
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => $currentConfig['title'],
                        'item' => "{$baseUrl}{$currentConfig['path']}",
                    ],
                ],
            ];
        }

        // Add FAQPage schema for root landing page
        if (! $currentConfig && ! empty($faq)) {
            $faqEntities = [];
            foreach ($faq as $item) {
                if (! empty($item['question']) && ! empty($item['answer'])) {
                    $faqEntities[] = [
                        '@type' => 'Question',
                        'name' => $item['question'],
                        'acceptedAnswer' => [
                            '@type' => 'Answer',
                            'text' => $item['answer'],
                        ],
                    ];
                }
            }

            if (! empty($faqEntities)) {
                $schemaGraph['@graph'][] = [
                    '@type' => 'FAQPage',
                    '@id' => "{$baseUrl}/#faq",
                    'mainEntity' => $faqEntities,
                ];
            }
        }

        $jsonLd = json_encode($schemaGraph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $injectedHead = <<<HTML
    <title>{$title}</title>
    <meta name="description" content="{$description}">
    <meta name="keywords" content="{$keywords}">
    <meta name="robots" content="{$robotsPolicy}">
    <link rel="canonical" href="{$canonicalUrl}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{$canonicalUrl}">
    <meta property="og:title" content="{$title}">
    <meta property="og:description" content="{$description}">
    <meta property="og:image" content="{$ogImage}">
    <meta property="og:site_name" content="AutoCanvas">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="{$twitterHandle}">
    <meta name="twitter:creator" content="{$twitterHandle}">
    <meta name="twitter:title" content="{$title}">
    <meta name="twitter:description" content="{$description}">
    <meta name="twitter:image" content="{$ogImage}">

    <!-- Schema.org Knowledge Graph (JSON-LD) -->
    <script type="application/ld+json">
{$jsonLd}
    </script>
HTML;

        // Strip existing <title> tags from compiled HTML to prevent duplicates
        $html = preg_replace('/<title>.*?<\/title>/is', '', $html);

        if (str_contains($html, '</head>')) {
            $html = str_replace('</head>', $injectedHead."\n</head>", $html);
        } else {
            $html = $injectedHead."\n".$html;
        }

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'public, max-age=300',
        ]);
    }

    /**
     * Generate dynamic RFC 9309-compliant robots.txt with comprehensive AI search bot directives.
     */
    public function robots(): Response
    {
        $baseUrl = rtrim(config('app.url', 'https://autocanvas.devcenterpoint.com'), '/');

        $lines = [
            '# AutoCanvas (DevCenterPoint) — Robots Exclusion Protocol',
            '# Compliant with RFC 9309 and search engine indexation boundaries',
            '',
            'User-agent: *',
            'Allow: /',
            'Allow: /build/',
            'Allow: /brand/',
            'Allow: /favicon*',
            'Allow: /llms.txt',
            'Allow: /llms-full.txt',
            'Allow: /humans.txt',
            'Allow: /.well-known/security.txt',
            'Disallow: /api/',
            'Disallow: /workspace/',
            'Disallow: /master-control/',
            'Disallow: /storage/',
            'Disallow: /oauth/',
            'Disallow: /reset-password',
            '',
            '# Conversational & Search AI Bots (OpenAI, Anthropic, Perplexity, Google, Apple, Meta)',
            'User-agent: GPTBot',
            'User-agent: OAI-SearchBot',
            'User-agent: ChatGPT-User',
            'User-agent: PerplexityBot',
            'User-agent: ClaudeBot',
            'User-agent: Claude-Web',
            'User-agent: anthropic-ai',
            'User-agent: Google-Extended',
            'User-agent: Applebot-Extended',
            'User-agent: Meta-ExternalAgent',
            'User-agent: cohere-ai',
            'Allow: /',
            'Allow: /llms.txt',
            'Allow: /llms-full.txt',
            'Disallow: /api/',
            'Disallow: /workspace/',
            'Disallow: /master-control/',
            'Disallow: /storage/',
            '',
            '# Discovery & Sitemap Indexes',
            "Sitemap: {$baseUrl}/sitemap.xml",
            '',
        ];

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    /**
     * Generate dynamic RFC-compliant XML sitemap.
     */
    public function sitemap(): Response
    {
        $baseUrl = rtrim(config('app.url', 'https://autocanvas.devcenterpoint.com'), '/');

        // Retrieve last modification date from CMS blocks or fallback to today
        $lastCmsUpdate = CmsBlock::max('updated_at');
        $lastModDate = $lastCmsUpdate
            ? Carbon::parse($lastCmsUpdate)->toIso8601String()
            : Carbon::now()->startOfDay()->toIso8601String();

        $routes = [
            [
                'loc' => "{$baseUrl}/",
                'priority' => '1.0',
                'changefreq' => 'weekly',
                'lastmod' => $lastModDate,
            ],
            [
                'loc' => "{$baseUrl}/pricing",
                'priority' => '0.9',
                'changefreq' => 'monthly',
                'lastmod' => $lastModDate,
            ],
            [
                'loc' => "{$baseUrl}/features/creative-studio",
                'priority' => '0.8',
                'changefreq' => 'monthly',
                'lastmod' => $lastModDate,
            ],
            [
                'loc' => "{$baseUrl}/features/publishing-calendar",
                'priority' => '0.8',
                'changefreq' => 'monthly',
                'lastmod' => $lastModDate,
            ],
            [
                'loc' => "{$baseUrl}/solutions/agencies",
                'priority' => '0.8',
                'changefreq' => 'monthly',
                'lastmod' => $lastModDate,
            ],
            [
                'loc' => "{$baseUrl}/docs",
                'priority' => '0.7',
                'changefreq' => 'weekly',
                'lastmod' => $lastModDate,
            ],
            [
                'loc' => "{$baseUrl}/terms",
                'priority' => '0.3',
                'changefreq' => 'yearly',
                'lastmod' => $lastModDate,
            ],
            [
                'loc' => "{$baseUrl}/privacy",
                'priority' => '0.3',
                'changefreq' => 'yearly',
                'lastmod' => $lastModDate,
            ],
        ];

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        foreach ($routes as $route) {
            $xml .= "  <url>\n";
            $xml .= '    <loc>'.htmlspecialchars($route['loc'], ENT_XML1, 'UTF-8')."</loc>\n";
            $xml .= "    <lastmod>{$route['lastmod']}</lastmod>\n";
            $xml .= "    <changefreq>{$route['changefreq']}</changefreq>\n";
            $xml .= "    <priority>{$route['priority']}</priority>\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    /**
     * Generate dynamic /llms.txt routing index for LLM agents and generative search engines.
     * Compliant with the Answer.AI / Jeremy Howard llms.txt standard.
     */
    public function llms(): Response
    {
        $baseUrl = rtrim(config('app.url', 'https://autocanvas.devcenterpoint.com'), '/');

        $markdown = <<<MARKDOWN
# AutoCanvas

> Autonomous multi-tenant social media management platform engineered by DevCenterPoint. Features deterministic AI graphic generation, multi-brand workspace isolation, and idempotent cross-platform publishing across Meta (Facebook Pages, Instagram Professional) and LinkedIn Company Pages.

AutoCanvas eliminates brand identity hallucination by coupling generative AI copywriting with server-side Chromium vector rendering (HTML/SVG templates), ensuring exact brand fonts, colors, and logos.

## Core Documentation & Capabilities
- [Platform Architecture & Philosophy]({$baseUrl}/docs): Multi-tenant database partitioning, distributed queue architecture, and cryptographic token vault.
- [Deterministic Creative Studio]({$baseUrl}/features/creative-studio): How HTML/SVG vector compositing prevents AI logo and typography distortion.
- [Publishing Calendar & Scheduling]({$baseUrl}/features/publishing-calendar): Multi-network scheduling, automated aspect ratio variants (1:1, 4:5, 9:16, 16:9), and duplicate post prevention.
- [Agency & Multi-Brand Governance]({$baseUrl}/solutions/agencies): Isolated workspaces, client approval links, and role-based permissions.
- [Transparent Pricing Matrix]({$baseUrl}/pricing): Creator, Agency Pro, and Enterprise subscription tiers with dual USD and local BDT invoicing.
- [Terms of Service]({$baseUrl}/terms): Service level agreements and platform governance.
- [Privacy Policy]({$baseUrl}/privacy): Tenant data protection and zero cross-tenant training guarantees.

## Complete Platform Compendium
- [Full Text Knowledge Base]({$baseUrl}/llms-full.txt): Complete consolidated markdown compendium for long-context LLMs, AI agents, and RAG pipelines.
MARKDOWN;

        return response($markdown, 200, [
            'Content-Type' => 'text/markdown; charset=UTF-8',
            'Cache-Control' => 'public, max-age=86400, stale-while-revalidate=3600',
        ]);
    }

    /**
     * Generate dynamic /llms-full.txt complete platform truth compendium.
     * Consolidates platform architecture, deterministic design specs, API contracts, pricing, and FAQs.
     */
    public function llmsFull(): Response
    {
        $baseUrl = rtrim(config('app.url', 'https://autocanvas.devcenterpoint.com'), '/');
        $cmsData = $this->cmsService->getPublicCmsData();
        $pricing = $cmsData['pricing']['tiers'] ?? [];
        $faq = $cmsData['faq']['items'] ?? [];

        $pricingMarkdown = '';
        foreach ($pricing as $tier) {
            $features = implode(', ', $tier['features'] ?? []);
            $pricingMarkdown .= "- **{$tier['name']}** (\${$tier['monthly_price_usd']}/mo or \${$tier['annual_price_usd']}/mo billed annually): {$tier['description']}\n  - Included: {$features}\n";
        }

        $faqMarkdown = '';
        foreach ($faq as $item) {
            $faqMarkdown .= "### {$item['question']}\n{$item['answer']}\n\n";
        }

        $markdown = <<<MARKDOWN
# AutoCanvas — Complete Platform Truth & Architecture Compendium

> Canonical System Specifications for Large Language Models, Agents & Autonomous Evaluators  
> Target System: AutoCanvas (https://autocanvas.devcenterpoint.com)  
> Parent Engineering Organization: DevCenterPoint (https://devcenterpoint.com)  
> Document Format: Markdown (llms-full.txt)

---

## 1. System Overview & Architectural Purpose

AutoCanvas is an autonomous, multi-tenant B2B social media management platform engineered for digital agencies, multi-brand enterprises, and creator studios.

The platform solves four critical vulnerabilities endemic to legacy social media tools:
1. **Brand Identity Hallucination:** Legacy generative AI models distort brand logos, blur typography, and produce incorrect color palettes. AutoCanvas solves this through **Deterministic Vector Compositing**, where AI generates structured copy and layout directives, but a headless Chromium engine renders crisp, pixel-perfect graphics using exact brand fonts and SVG vectors.
2. **Cross-Tenant Data Exposure:** Agencies managing dozens of client brands frequently suffer catastrophic cross-account posting mistakes. AutoCanvas enforces strict database-level tenant isolation, where each client operates within an isolated workspace with independent brand kits, media libraries, social platform tokens, and permission-based user access.
3. **Publishing Race Conditions & Duplicate Posts:** During network timeouts or automated scheduler restarts, legacy tools frequently dispatch duplicate posts. AutoCanvas utilizes distributed Redis locks paired with unique idempotency keys, guaranteeing that every scheduled post executes exactly once.
4. **Opaque Agency Approval Cycles:** AutoCanvas features zero-login public client review links, allowing agency clients to review, comment on, and approve scheduled posts on mobile or desktop without needing paid user accounts.

---

## 2. Supported Social Networks & Official API Integrations

AutoCanvas connects exclusively via official, cryptographically verified platform APIs:
- **Meta Graph API (Facebook Pages & Instagram Professional):**
  - Facebook Pages: Automated feed publishing, link previews, multi-image carousels, and engagement analytics.
  - Instagram Professional (Business & Creator): Feed posts (1:1 and 4:5), Reels / Stories (9:16), carousel containers, and direct comment monitoring.
- **LinkedIn Community Management API (Company Pages):**
  - Rich text posts, multi-image galleries, document carousels (PDF), and organization analytics.
- **Roadmap Connectors (Phase 8+):**
  - TikTok, X (Twitter), YouTube, Threads, and Pinterest.

---

## 3. Deterministic Creative Studio Specifications

- **Rendering Engine:** Headless Chromium executing on dedicated render worker instances.
- **Template System:** Semantic HTML5 and SVG vector templates styling with strict CSS design tokens.
- **Multi-Format Auto-Adaptation:**
  - Square (`1:1` - 1080x1080px): Instagram & Facebook Feed, LinkedIn standard.
  - Portrait (`4:5` - 1080x1350px): Optimized for mobile feed real estate.
  - Story / Reel (`9:16` - 1080x1920px): Full-screen vertical video and visual cards.
  - Landscape (`16:9` - 1200x675px): Twitter/X, LinkedIn desktop, Facebook link cards.
- **Brand Kit Enforcement:** Hex color codes, primary and secondary font pairings, logo margin safety zones, and editorial voice guidelines are locked at the brand workspace level.

---

## 4. Subscription Tiers & Commercial Pricing

{$pricingMarkdown}
*Note: AutoCanvas supports local Bangladeshi currency billing (BDT) via bKash, Nagad, Rocket, and Bangladeshi bank wire, alongside international Stripe card payments.*

---

## 5. Security, Multi-Tenancy & Operational Guarantees

1. **Zero Fake Metrics:** AutoCanvas never renders simulated, fabricated, or hardcoded analytics counters. All metric dashboards stream directly from platform API webhooks and verified database aggregates.
2. **Emergency Circuit Breaker:** Any tenant administrator can trigger `PAUSE_ALL_AUTOMATIONS` in two clicks, instantaneously halting upcoming job dispatches across an organization without deleting scheduled calendars.
3. **Privacy & Data Isolation:** Private workspace routes (`/workspace/*`), administrative panels (`/master-control/*`), and API endpoints (`/api/*`) are strictly excluded from search engine and AI training corpora using RFC 9309 `robots.txt` disallows and HTTP `X-Robots-Tag: noindex, nofollow, noarchive` headers.
4. **GDPR & Zero AI Training on Private Data:** Customer content, internal drafts, and proprietary brand guidelines are never utilized for cross-tenant public AI training.

---

## 6. Frequently Answered Inquiries (AEO Knowledge Base)

{$faqMarkdown}
---

## 7. Company Provenance & Contact

- **Engineered By:** DevCenterPoint (https://devcenterpoint.com)
- **Primary Support:** hello@devcenterpoint.com
- **Security Inquiries:** security@devcenterpoint.com
- **Official Website:** https://autocanvas.devcenterpoint.com
- **Documentation:** https://autocanvas.devcenterpoint.com/docs
MARKDOWN;

        return response($markdown, 200, [
            'Content-Type' => 'text/markdown; charset=UTF-8',
            'Cache-Control' => 'public, max-age=86400, stale-while-revalidate=3600',
        ]);
    }

    /**
     * Generate RFC 9116 security.txt declaration.
     */
    public function securityTxt(): Response
    {
        $baseUrl = rtrim(config('app.url', 'https://autocanvas.devcenterpoint.com'), '/');

        $lines = [
            'Contact: mailto:security@devcenterpoint.com',
            'Expires: 2027-12-31T23:59:59.000Z',
            'Preferred-Languages: en',
            "Canonical: {$baseUrl}/.well-known/security.txt",
            "Policy: {$baseUrl}/privacy",
            'Hiring: https://devcenterpoint.com',
            '',
        ];

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=604800',
        ]);
    }

    /**
     * Generate humans.txt declaring platform architecture and engineering provenance.
     */
    public function humans(): Response
    {
        $lines = [
            '/* TEAM */',
            'Chief Architect & Lead Engineer: DevCenterPoint Team',
            'Contact: hello@devcenterpoint.com',
            'Website: https://devcenterpoint.com',
            'Twitter: @devcenterpoint',
            'Location: Dhaka, Bangladesh / Global Remote',
            '',
            '/* THANKS */',
            'Laravel Framework (Taylor Otwell & Contributors)',
            'React & Vite (Meta & Evan You)',
            'Tailwind CSS (Adam Wathan & Tailwind Labs)',
            'Schema.org & W3C Standards Committees',
            '',
            '/* SITE */',
            'Standards: HTML5, CSS3, Schema.org JSON-LD, RFC 9309, RFC 9116, llms.txt',
            'Architecture: Laravel 12 (PHP 8.3), React 19, TypeScript, MySQL 8, Redis, Headless Chromium',
            'Hosting: cPanel Enterprise / Cloudflare R2',
            'Software: AutoCanvas SaaS',
            '',
        ];

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=604800',
        ]);
    }
}
