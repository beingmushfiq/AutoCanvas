<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\ControlPlane\Models\CmsBlock;
use App\Modules\ControlPlane\Services\MasterCmsService;
use App\Modules\Organization\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoEngineTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test RFC 9309-compliant robots.txt generation.
     */
    public function test_robots_txt_returns_rfc_compliant_output(): void
    {
        $response = $this->get('/robots.txt');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/plain', $response->headers->get('Content-Type'));

        $content = $response->getContent();
        $this->assertStringContainsString('User-agent: *', $content);
        $this->assertStringContainsString('Disallow: /api/', $content);
        $this->assertStringContainsString('Disallow: /workspace/', $content);
        $this->assertStringContainsString('Disallow: /master-control/', $content);
        $this->assertStringContainsString('Disallow: /storage/', $content);
        $this->assertStringContainsString('User-agent: GPTBot', $content);
        $this->assertStringContainsString('User-agent: PerplexityBot', $content);
        $this->assertStringContainsString('User-agent: ClaudeBot', $content);
        $this->assertStringContainsString('Sitemap: ', $content);
        $this->assertStringContainsString('/sitemap.xml', $content);
    }

    /**
     * Test RFC-compliant XML sitemap output and schema validity.
     */
    public function test_sitemap_xml_returns_valid_xml_with_canonical_routes(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertStatus(200);
        $this->assertStringContainsString('application/xml', $response->headers->get('Content-Type'));

        $content = $response->getContent();
        $this->assertStringStartsWith('<?xml version="1.0" encoding="UTF-8"?>', $content);
        $this->assertStringContainsString('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', $content);

        // Verify public canonical routes are indexed
        $this->assertStringContainsString('<loc>', $content);
        $this->assertStringContainsString('/pricing</loc>', $content);
        $this->assertStringContainsString('/features/creative-studio</loc>', $content);
        $this->assertStringContainsString('/solutions/agencies</loc>', $content);
        $this->assertStringContainsString('/docs</loc>', $content);

        // Verify private routes are strictly excluded from sitemap
        $this->assertStringNotContainsString('/workspace', $content);
        $this->assertStringNotContainsString('/master-control', $content);
        $this->assertStringNotContainsString('/api/', $content);

        // Verify XML parses cleanly without syntax errors
        $xmlObj = simplexml_load_string($content);
        $this->assertNotFalse($xmlObj, 'Sitemap XML failed XML parse validation.');
        $this->assertGreaterThanOrEqual(5, count($xmlObj->url));
    }

    /**
     * Test X-Robots-Tag header isolation on private APIs and control plane views.
     */
    public function test_private_routes_deliver_x_robots_noindex_header(): void
    {
        // 1. API route
        $apiResponse = $this->getJson('/api/v1/cms/public-data');
        $apiResponse->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

        // 2. Private workspace route
        $workspaceResponse = $this->get('/workspace/dashboard');
        $workspaceResponse->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

        // 3. Master control route
        $adminResponse = $this->get('/master-control/login');
        $adminResponse->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

        // 4. Public landing page should NOT have noindex header
        $publicResponse = $this->get('/');
        $this->assertNull($publicResponse->headers->get('X-Robots-Tag'));
    }

    /**
     * Test homepage server-side meta and Schema.org JSON-LD injection.
     */
    public function test_homepage_injects_schema_and_meta_tags(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $content = $response->getContent();

        $this->assertStringContainsString('<title>', $content);
        $this->assertStringContainsString('<meta name="description"', $content);
        $this->assertStringContainsString('<link rel="canonical"', $content);
        $this->assertStringContainsString('<meta property="og:title"', $content);
        $this->assertStringContainsString('<meta name="twitter:card"', $content);
        $this->assertStringContainsString('<script type="application/ld+json">', $content);
        $this->assertStringContainsString('"@type": "Organization"', $content);
        $this->assertStringContainsString('"@type": "SoftwareApplication"', $content);
        $this->assertStringContainsString('"@type": "WebSite"', $content);
    }

    /**
     * Test CMS SEO block persistence and cache invalidation.
     */
    public function test_cms_seo_block_persists_and_clears_cache(): void
    {
        $admin = User::factory()->create([
            'email' => 'superadmin@autocanvas.io',
            'password' => bcrypt('password123'),
            'is_platform_admin' => true,
            'status' => 'active',
        ]);

        $newSeoData = [
            'meta_title' => 'Customized AutoCanvas Title for Growth Teams',
            'meta_description' => 'Customized SEO description verifying live CMS persistence and cache clearing.',
            'meta_keywords' => 'custom, seo, test',
            'canonical_url' => 'https://autocanvas.devcenterpoint.com',
            'og_image_url' => '/brand/custom-og.png',
            'twitter_handle' => '@devcenterpoint',
            'robots_policy' => 'index, follow',
            'schema_organization_name' => 'AutoCanvas Enterprise',
            'schema_organization_url' => 'https://autocanvas.devcenterpoint.com',
            'schema_logo_url' => '/brand/logo.svg',
            'social_profiles' => ['https://linkedin.com/company/devcenterpoint'],
        ];

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/control-plane/cms/blocks/seo', [
                'title' => 'Search Engine Optimization',
                'content_json' => $newSeoData,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify database persistence
        $this->assertDatabaseHas('platform_cms_blocks', [
            'block_key' => 'seo',
            'title' => 'Search Engine Optimization',
        ]);

        // Verify public API returns updated SEO block
        $publicCms = $this->getJson('/api/v1/cms/public-data');
        $publicCms->assertStatus(200)
            ->assertJsonPath('data.seo.meta_title', 'Customized AutoCanvas Title for Growth Teams');

        // Verify landing page pre-injects updated SEO title
        $homeResponse = $this->get('/');
        $this->assertStringContainsString('Customized AutoCanvas Title for Growth Teams', $homeResponse->getContent());
    }

    /**
     * Test /llms.txt Answer.AI standard markdown output.
     */
    public function test_llms_txt_returns_markdown_and_curated_routes(): void
    {
        $response = $this->get('/llms.txt');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/markdown', $response->headers->get('Content-Type'));

        $content = $response->getContent();
        $this->assertStringContainsString('# AutoCanvas', $content);
        $this->assertStringContainsString('> Autonomous multi-tenant social media management', $content);
        $this->assertStringContainsString('/features/creative-studio', $content);
        $this->assertStringContainsString('/features/publishing-calendar', $content);
        $this->assertStringContainsString('/solutions/agencies', $content);
        $this->assertStringContainsString('/pricing', $content);
        $this->assertStringContainsString('/llms-full.txt', $content);
    }

    /**
     * Test /llms-full.txt complete platform truth compendium.
     */
    public function test_llms_full_txt_returns_consolidated_platform_truth(): void
    {
        $response = $this->get('/llms-full.txt');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/markdown', $response->headers->get('Content-Type'));

        $content = $response->getContent();
        $this->assertStringContainsString('# AutoCanvas — Complete Platform Truth & Architecture Compendium', $content);
        $this->assertStringContainsString('Deterministic Vector Compositing', $content);
        $this->assertStringContainsString('Meta Graph API', $content);
        $this->assertStringContainsString('LinkedIn Community Management API', $content);
        $this->assertStringContainsString('DevCenterPoint', $content);
        $this->assertStringContainsString('Creator & Boutique', $content);
        $this->assertStringContainsString('Enterprise Platform', $content);
    }

    /**
     * Test RFC 9116 security.txt and humans.txt availability.
     */
    public function test_security_txt_and_humans_txt_available(): void
    {
        $secResponse = $this->get('/.well-known/security.txt');
        $secResponse->assertStatus(200);
        $this->assertStringContainsString('text/plain', $secResponse->headers->get('Content-Type'));
        $this->assertStringContainsString('mailto:security@devcenterpoint.com', $secResponse->getContent());
        $this->assertStringContainsString('Canonical: ', $secResponse->getContent());

        $humResponse = $this->get('/humans.txt');
        $humResponse->assertStatus(200);
        $this->assertStringContainsString('text/plain', $humResponse->headers->get('Content-Type'));
        $this->assertStringContainsString('DevCenterPoint Team', $humResponse->getContent());
        $this->assertStringContainsString('Laravel 12', $humResponse->getContent());
    }

    /**
     * Test expanded AI search bots in robots.txt.
     */
    public function test_robots_txt_contains_llms_and_expanded_ai_bots(): void
    {
        $response = $this->get('/robots.txt');
        $content = $response->getContent();

        $this->assertStringContainsString('Allow: /llms.txt', $content);
        $this->assertStringContainsString('Allow: /llms-full.txt', $content);
        $this->assertStringContainsString('User-agent: OAI-SearchBot', $content);
        $this->assertStringContainsString('User-agent: ChatGPT-User', $content);
        $this->assertStringContainsString('User-agent: Claude-Web', $content);
        $this->assertStringContainsString('User-agent: Applebot-Extended', $content);
        $this->assertStringContainsString('User-agent: Meta-ExternalAgent', $content);
    }

    /**
     * Test canonical subpages inject route-specific pre-rendered metadata and breadcrumbs.
     */
    public function test_canonical_subpages_inject_pre_rendered_metadata(): void
    {
        // 1. Pricing subpage
        $pricingResponse = $this->get('/pricing');
        $pricingResponse->assertStatus(200);
        $pricingContent = $pricingResponse->getContent();
        $this->assertStringContainsString('Pricing & Subscriptions — AutoCanvas', $pricingContent);
        $this->assertStringContainsString('/pricing', $pricingContent);
        $this->assertStringContainsString('BreadcrumbList', $pricingContent);

        // 2. Creative studio subpage
        $studioResponse = $this->get('/features/creative-studio');
        $studioResponse->assertStatus(200);
        $studioContent = $studioResponse->getContent();
        $this->assertStringContainsString('Deterministic Creative Studio — AutoCanvas', $studioContent);
        $this->assertStringContainsString('BreadcrumbList', $studioContent);

        // 3. Documentation subpage
        $docsResponse = $this->get('/docs');
        $docsResponse->assertStatus(200);
        $docsContent = $docsResponse->getContent();
        $this->assertStringContainsString('Platform Documentation & Architecture — AutoCanvas', $docsContent);
    }
}
