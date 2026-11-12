# AutoCanvas — Comprehensive Technical SEO & Discovery Baseline Audit

> **Audit Date:** 2026-11-12  
> **Auditor:** Principal Technical SEO Architect (Everything-SEO Engine)  
> **Target Domain:** `https://autocanvas.devcenterpoint.com`  
> **Status:** Remediation In Progress

---

## 1. Executive Summary

A comprehensive baseline audit of the AutoCanvas monorepo was conducted across technical architecture, crawl governance, metadata configuration, structured data modeling, and performance characteristics.

### Scorecard Summary
| Domain | Baseline Rating | Target Rating | Primary Deficit |
| :--- | :--- | :--- | :--- |
| **Robots Exclusion (RFC 9309)** | Critical (20/100) | Exceptional (100/100) | Bare file with zero private route protections and no sitemap reference. |
| **Sitemap Discovery** | Critical (0/100) | Exceptional (100/100) | Complete absence of `sitemap.xml`. |
| **Tenant Indexation Isolation** | High Risk (40/100) | Zero-Risk (100/100) | No `X-Robots-Tag: noindex` headers on API or authenticated routes. |
| **Metadata & OpenGraph** | Low (35/100) | Exceptional (95/100) | Static Vite defaults; missing dynamic canonical tags, twitter cards, and keywords. |
| **Structured Data (Schema.org)** | Deficient (0/100) | Advanced (98/100) | Zero JSON-LD markup on landing page or marketing views. |
| **Core Web Vitals & Assets** | Good (82/100) | Exceptional (95/100) | Modern Vite bundle splitting; minor font and image optimization opportunities. |

---

## 2. In-Depth Technical Audit Findings

### Deficit 1: Crawl Governance & `robots.txt`
- **Location:** `backend/public/robots.txt`
- **Baseline State:**
  ```text
  User-agent: *
  Disallow:
  ```
- **Vulnerability:** Allows unrestricted crawling of `/api/v1/`, `/workspace/`, `/master-control/`, and database storage paths. Lacks any `Sitemap:` directive.
- **Remediation:** Replace with an RFC 9309-compliant dynamic controller output defining explicit `Disallow` rules for private scopes, dedicated allowances for conversational AI search agents, and pointing to `https://autocanvas.devcenterpoint.com/sitemap.xml`.

### Deficit 2: XML Sitemap Nonexistence
- **Location:** Monorepo root / `backend/public/`
- **Baseline State:** 404 Not Found on `/sitemap.xml`.
- **Impact:** Search engine bots must rely on heuristic link discovery, slowing indexation of feature updates and public marketing pages.
- **Remediation:** Implement `SeoController@sitemap` delivering dynamic XML sitemap with canonical URLs, change frequencies, priority weighting, and ISO 8601 `<lastmod>` timestamps.

### Deficit 3: Lack of HTTP `X-Robots-Tag` Headers
- **Location:** `backend/routes/api.php` and SPA front controller.
- **Baseline State:** API endpoints and private SPA paths do not emit `X-Robots-Tag`.
- **Impact:** If private workspace URLs are ever linked from external sources or social media, search crawlers can index the URLs even if crawling body content is restricted.
- **Remediation:** Implement `EnsureRobotsIndexingHeaders` middleware applying `X-Robots-Tag: noindex, nofollow, noarchive` across all `/api/*`, `/master-control/*`, and `/workspace/*` routes.

### Deficit 4: Static Entrypoint Metadata
- **Location:** `frontend/index.html`
- **Baseline State:** Contains only generic static `<meta>` tags and placeholder description.
- **Impact:** Shared links on LinkedIn, Twitter, and Slack render generic snippets or broken previews.
- **Remediation:**
  1. Pre-inject rich title, description, canonical link, and OpenGraph/Twitter Card tags at the Laravel web controller layer (`backend/routes/web.php`).
  2. Implement React hook `useDocumentHead` to synchronize document metadata dynamically on client-side route changes.

### Deficit 5: Total Absence of Structured Knowledge (Schema.org)
- **Baseline State:** Zero JSON-LD tags present in the DOM.
- **Impact:** Ineligible for Google Rich Results (software app badges, FAQ accordions, breadcrumbs) and reduced entity recognition across LLMs (Perplexity, ChatGPT Search).
- **Remediation:** Inject Schema.org JSON-LD graph models for `Organization`, `SoftwareApplication`, `WebSite`, and `FAQPage`.

---

## 3. Remediation Matrix & Verification Protocol

| Item | Action Item | Target File(s) | Success Metric |
| :--- | :--- | :--- | :--- |
| **R1** | Dynamic Robots.txt Engine | `SeoController.php`, `web.php` | 200 OK, `text/plain`, RFC 9309 compliant, Disallow rules present |
| **R2** | Dynamic XML Sitemap Engine | `SeoController.php`, `web.php` | 200 OK, `application/xml`, valid XML tree, proper canonical URLs |
| **R3** | HTTP Header Security Layer | `EnsureRobotsIndexingHeaders.php` | `X-Robots-Tag: noindex, nofollow, noarchive` present on private routes |
| **R4** | Server-Side Head Pre-Injection | `web.php`, `index.html` | Raw HTML curl of `/` contains full `<title>`, `<meta>`, and `<script type="application/ld+json">` |
| **R5** | Client-Side Dynamic Head Hook | `useDocumentHead.ts`, `schemaGenerators.ts` | DOM `<head>` updates dynamically on client-side SPA navigation |
| **R6** | Master Control SEO Governance | `MasterCmsService.php`, `MasterCmsPage.tsx` | Platform admins can view and update SEO configurations with cache invalidation |
| **R7** | Automated Verification Suite | `backend/tests/Feature/SeoEngineTest.php` | 100% passing tests for robots, sitemap, security headers, and JSON-LD |

