<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Modules\ControlPlane\Models\CmsBlock;
use App\Modules\ControlPlane\Services\MasterCmsService;
use Carbon\Carbon;
use Illuminate\Http\Response;

class SeoController extends Controller
{
    public function __construct(
        protected MasterCmsService $cmsService
    ) {}

    /**
     * Serve landing page with server-side pre-injected SEO metadata and JSON-LD structured data.
     * Implements Hybrid Pre-Injection for maximum crawler indexation on cPanel zero-Node hosting.
     */
    public function landingPage(): Response
    {
        $cmsData = $this->cmsService->getPublicCmsData();
        $seo = $cmsData['seo'] ?? $this->cmsService->getFactorySeo();
        $faq = $cmsData['faq']['items'] ?? [];

        $spaIndex = public_path('index.html');
        $html = file_exists($spaIndex)
            ? file_get_contents($spaIndex)
            : '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>AutoCanvas</title></head><body><div id="root"></div></body></html>';

        $baseUrl = rtrim(config('app.url', 'https://autocanvas.devcenterpoint.com'), '/');
        $canonicalUrl = rtrim($seo['canonical_url'] ?? $baseUrl, '/');
        $title = htmlspecialchars($seo['meta_title'] ?? 'AutoCanvas — Autonomous Social Media Management & Creative Studio', ENT_QUOTES, 'UTF-8');
        $description = htmlspecialchars($seo['meta_description'] ?? 'Enterprise-grade multi-tenant social media management platform.', ENT_QUOTES, 'UTF-8');
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

        if (! empty($faq)) {
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
    <link rel="canonical" href="{$canonicalUrl}/">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{$canonicalUrl}/">
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
     * Generate dynamic RFC 9309-compliant robots.txt.
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
            'Disallow: /api/',
            'Disallow: /workspace/',
            'Disallow: /master-control/',
            'Disallow: /storage/',
            'Disallow: /oauth/',
            'Disallow: /reset-password',
            '',
            '# Conversational AI Search Bots (Perplexity, ChatGPT, Claude, Gemini)',
            'User-agent: GPTBot',
            'User-agent: PerplexityBot',
            'User-agent: ClaudeBot',
            'User-agent: Google-Extended',
            'Allow: /',
            'Disallow: /api/',
            'Disallow: /workspace/',
            'Disallow: /master-control/',
            'Disallow: /storage/',
            '',
            '# XML Sitemap Reference',
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
}
