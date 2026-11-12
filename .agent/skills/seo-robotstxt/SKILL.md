---
name: seo-robotstxt
description: RFC 9309 Robots Exclusion Protocol engineering, crawler access control, bot-specific user-agent rules, and accidental disallow prevention.
metadata:
  category: Technical SEO
  discipline: Technical Architecture
  version: "1.0.0"
---

# Robots.txt

## A. Purpose
The Robots.txt skill governs the technical design, deployment, and auditing of the `robots.txt` file in accordance with RFC 9309 (Robots Exclusion Protocol). The `robots.txt` file is the first file fetched by compliant search engine crawlers when inspecting a domain. It dictates which directories and URL parameter structures search engine bots are legally permitted or prohibited from requesting. A single syntax error or stray slash in `robots.txt` (such as `Disallow: /`) can instantly de-index an entire multi-million dollar digital business from search results within 24 hours. This skill provides an auditable, bulletproof methodology for managing crawler access permissions.

## B. Trigger Conditions
Invoke this skill when:
1. Launching a new website or migrating a staging site to production.
2. Blocking crawler access to administrative backends, internal search pages, faceted filters, or private API endpoints.
3. Managing access for AI web scrapers and generative model training bots (e.g., `GPTBot`, `ClaudeBot`, `PerplexityBot`).
4. Resolving Google Search Console "Blocked by robots.txt" indexing errors and warnings.

Upstream dependencies: [Crawling](../Crawling/SKILL.md) and [URL Optimization](../../On-page%20SEO/URL%20Optimization/SKILL.md).

## C. Scope and Boundaries
- **In-Scope**:
  - RFC 9309 standard compliance (`User-agent`, `Allow`, `Disallow`, `Sitemap`).
  - Precedence and specificity rules (wildcards `*` and end-of-string matching `$`).
  - Bot-specific user-agent management (Googlebot, Bingbot, commercial SEO crawlers, AI scraping bots).
  - Validation via command-line parsers and Google Search Console robots testing tools.
  - Fail-safe deployment protocols preventing accidental sitewide disallow pushes.
- **Out-of-Scope**:
  - Direct HTML meta robots directives (Handled by [Indexing](../Indexing/SKILL.md)).
  - Server-side IP blocking or firewall rate limiting (Handled by Cloudflare/WAF).
  - Handling HTTP 301 redirects (Handled by [Redirects](../Redirects/SKILL.md)).

## D. Required Inputs
1. **Target Domain Hostname**: Base URL (`https://example.com/robots.txt`).
2. **Current Robots.txt File Content**: Raw text currently live at root.
3. **Directory Taxonomy & Sensitive Paths**: Inventory of admin paths, checkout flows, internal search queries, and private APIs.
4. **AI Crawler Access Policy**: Business decision on allowing vs. blocking LLM training scrapers (`GPTBot`, `Google-Extended`, etc.).

## E. Required Tools and Data Sources
- **Commercial Tooling**: Screaming Frog SEO Spider (Robots.txt audit, custom robots.txt simulation mode).
- **Zero-Cost / Open Source Alternatives**:
  - Google Search Console Robots.txt Report (Settings > Robots.txt).
  - Google Open Source `robotstxt` parser (C++ / Python bindings via `google-re2`).
  - Standard Unix CLI: `curl -s https://example.com/robots.txt`.
  - Python `urllib.robotparser` library.

## F. Core Concepts and Decision Principles
1. **RFC 9309 Standardized Precedence Rules**:
   - When conflicting directives apply to a URL, the **longest matching path rule** wins.
     ```
     User-agent: Googlebot
     Disallow: /solutions/
     Allow: /solutions/cloud-security/
     ```
     *Result*: Googlebot IS allowed to crawl `/solutions/cloud-security/` because the `Allow` rule (26 characters) is longer and more specific than the `Disallow` rule (12 characters).
2. **The "Disallow Does Not Equal Noindex" Reality**:
   - Putting `Disallow: /secret-page/` in `robots.txt` stops Googlebot from *crawling* the page content.
   - However, if any other page on the web links to `/secret-page/`, Google can and will **index the bare URL** in search results.
   - If a page must be kept out of search results, **DO NOT block it in robots.txt**. Allow it to be crawled, and add `<meta name="robots" content="noindex">` to the HTML `<head>`.
3. **The 500 Server Error Safeguard (Fail-Safe Behavior)**:
   - If a web server returns an HTTP 5xx Server Error when Googlebot requests `/robots.txt`, Googlebot assumes a temporary server outage and **halts all crawling on the entire website** to avoid overloading the origin.
   - The `/robots.txt` file must be cached at the CDN edge and return HTTP 200 OK with sub-100ms latency at all times.

## G. Operational Workflow

```
[Inspect Live /robots.txt via curl] -> [Audit for RFC 9309 Syntax Errors]
                 |                                      |
                 v                                      v
 [Map Disallowed Admin/Search Traps] -> [Define Specific Bot Permission Groups]
                 |                                      |
                 v                                      v
  [Test Regex Specificity & Wildcards] -> [Deploy with Staging Safety Gate]
```

### Step 1: Architectural Template Structure
Deploy a clean, modular `robots.txt` file structured into three logical sections:
```
# ==============================================================================
# RFC 9309 Robots Exclusion File for example.com
# ==============================================================================

# Section 1: Universal Web Crawlers (Googlebot, Bingbot, Applebot, etc.)
User-agent: *
Disallow: /admin/
Disallow: /checkout/
Disallow: /cart/
Disallow: /search
Disallow: /api/
Disallow: /*?*filter=*
Disallow: /*?*sort=*
Allow: /api/public/

# Section 2: AI Web Training Scrapers (Selective Policy)
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

# Section 3: Master XML Sitemap Index Declaration
Sitemap: https://example.com/sitemap_index.xml
```

### Step 2: Wildcard and End-of-String Pattern Matching
1. **The Asterisk (`*`) Wildcard**: Matches 0 or more instances of any character.
   - `Disallow: /*.pdf$` blocks all PDF files across all directories.
   - `Disallow: /private/*` blocks everything inside the `/private/` folder.
2. **The Dollar Sign (`$`) End Anchor**: Matches the exact termination of a URL string.
   - `Disallow: /unwanted-page$` blocks only `/unwanted-page`, but allows `/unwanted-page/child/`.

### Step 3: Scripted RFC 9309 Syntax Validation (Python)
Verify that your proposed directives parse correctly using Google's official logic:
```python
import urllib.robotparser

rp = urllib.robotparser.RobotFileParser()
rp.set_url("https://example.com/robots.txt")
# Test local string payload
robotstxt_content = """
User-agent: *
Disallow: /admin/
Disallow: /search?
Allow: /search/featured
Sitemap: https://example.com/sitemap_index.xml
"""
rp.parse(robotstxt_content.splitlines())

# Test specific URLs
assert rp.can_fetch("Googlebot", "https://example.com/solutions/cloud/") == True
assert rp.can_fetch("Googlebot", "https://example.com/admin/settings") == False
assert rp.can_fetch("Googlebot", "https://example.com/search?q=test") == False
assert rp.can_fetch("Googlebot", "https://example.com/search/featured") == True

print("All robots.txt access rules successfully verified!")
```

### Step 4: Staging Deployment Safety Check (CI/CD Pipeline)
To prevent accidentally pushing a staging `Disallow: /` into production:
1. Implement a mandatory CI/CD linting check:
   ```bash
   # Pre-deployment bash test
   if grep -q "Disallow: /" ./public/robots.txt && ! grep -q "Disallow: /admin/" ./public/robots.txt; then
       echo "FATAL ERROR: Catastrophic Sitewide Disallow detected in production robots.txt! Deployment aborted."
       exit 1
   fi
   ```

### Step 5: Validate via Google Search Console Robots.txt Report
1. Open GSC > Settings > Robots.txt.
2. Review the timestamp of Google’s latest fetch.
3. If deploying a high-priority unblock, click "Request re-crawl" to prompt Google to fetch the updated `robots.txt` within minutes.

## H. Analysis and Decision Framework
Use this framework to decide whether to use robots.txt:

```
                    [URL Path to Restrict]
                              |
                What is the operational goal?
                 /                          \
      [Prevent Bot Crawl Load]      [Keep Content Secret / Out of Index]
                |                                     |
       Disallow in robots.txt           DO NOT block in robots.txt.
       (Preserves crawl budget,         Instead: Require Password Login
        stops server load)              (HTTP Basic Auth) or apply
                                        `<meta name="robots" content="noindex">`
```

## I. Prioritization Framework
Score robots.txt remediation issues using the **Crawler Access Severity Index (CASI)**:

$$\text{CASI} = \text{Monthly Traffic of Blocked Pages} \times (\text{Accidental Sitewide Disallow: 100} + \text{Blocked CSS/JS: 15} + \text{Missing Sitemap Link: 5})$$

Any sitewide or commercial category blockage is a **P0 Emergency**.

## J. Deliverables & Specifications
Deliver a **Robots.txt Specification & Test Suite**:
1. `raw_robots_txt_content`: The complete text string.
2. `sitemap_declaration_verified`: Boolean confirming absolute URL.
3. `ai_crawler_policy`: Documented stance on GPTBot, ClaudeBot, and CCBot.
4. `critical_url_test_matrix`: Table of 10 sample URLs confirming Expected vs Actual Access (Allowed/Disallowed) across User-agents.

## K. Quality Assurance Checklist
- [ ] File is served with exact filename `robots.txt` (lowercase) at root domain (`/robots.txt`).
- [ ] Returns HTTP 200 OK (never 301, 302, 404, or 500).
- [ ] `Content-Type` header is `text/plain; charset=utf-8`.
- [ ] File size does not exceed **500KB** (Googlebot truncates and ignores files beyond 500KB).
- [ ] CSS, JavaScript, and essential layout images are NOT blocked.
- [ ] Absolute master sitemap URL is declared at the bottom.
- [ ] CI/CD guardrail in place preventing `Disallow: /` deployment to production.

## L. Failure Modes and Anti-Patterns
- **The Staging Leak**: Pushing a staging `robots.txt` containing `User-agent: * \n Disallow: /` to production, wiping the entire website out of Google Search within 48 hours.
- **Blocking CSS & JS**: Disallowing `/wp-content/themes/` or `/static/js/`, preventing Googlebot from rendering the page and generating "Page is not mobile-friendly" errors.
- **The "Case Sensitivity" Bug**: Writing `Disallow: /Admin/` when the real URLs are `/admin/`, rendering the disallow completely ineffective on Unix servers.

## M. AI-Agent Operating Instructions
1. An AI agent must parse `robots.txt` using RFC 9309 rules (longest path matches first).
2. Never output a generic `Disallow: /` rule without explicit, confirmed human operator consent.
3. Always include the absolute `Sitemap:` directive when authoring or rewriting `robots.txt`.

## N. Success Metrics & Verification Windows
- **Fetch Health**: Google Search Console reports "Fetched: 200 OK" for `robots.txt` with zero syntax warnings.
- **Zero Blocked Resources**: Zero critical commercial or editorial URLs appear in GSC "Indexed, though blocked by robots.txt" reports.

## O. Related Skills
- **Upstream Input**: [Crawling](../Crawling/SKILL.md), [URL Optimization](../../On-page%20SEO/URL%20Optimization/SKILL.md)
- **Direct Sibling**: [XML Sitemaps](../XML%20Sitemaps/SKILL.md), [Indexing](../Indexing/SKILL.md)
- **Traffic Protection**: [Traffic Growth](../../SEO%20Wins/Traffic%20Growth/SKILL.md)

## P. Authoritative References
- [RFC 9309: Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html) — The official IETF internet standard specification.
- [Google Search Central: Robots.txt Specifications](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt) — Google's parsing logic, limits, and user-agent guidelines.

## Q. Maintenance and Review Cycle
- **Pre-Deploy Gate**: Automatic unit tests run against `robots.txt` on every code merge to master branch.
