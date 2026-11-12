---
name: seo-indexing
description: Search engine indexation governance, canonical tag resolution, robots meta tag directives, and GSC Page Indexing error triage.
metadata:
  category: Technical SEO
  discipline: Technical Architecture
  version: "1.0.0"
---

# Indexing & Canonicalization

## A. Purpose
The Indexing skill establishes the technical governance and troubleshooting protocols for controlling which URLs enter, remain in, or are excluded from search engine indexes. While crawling represents bot discovery, indexing represents the actual storage, semantic evaluation, and ranking eligibility of a document in Google’s index database (Caffeine). Issues such as canonical ambiguity, accidental `noindex` directives, Soft 404 errors, and duplicate content prevent high-value pages from ranking. This skill provides an auditable methodology for resolving Google Search Console Page Indexing issues and enforcing canonical purity.

## B. Trigger Conditions
Invoke this skill when:
1. Google Search Console reports a sudden increase in "Discovered - currently not indexed" or "Crawled - currently not indexed" URLs.
2. New published pages fail to index within 7 to 14 days of launch.
3. Troubleshooting duplicate content issues where Google chooses a different canonical URL than the user-declared tag.
4. Auditing staging, testing, or development environments to prevent catastrophic accidental indexation.

Upstream dependencies: [Crawling](../Crawling/SKILL.md) and [URL Optimization](../../On-page%20SEO/URL%20Optimization/SKILL.md).

## C. Scope and Boundaries
- **In-Scope**:
  - `rel="canonical"` tag syntax, cross-domain canonicals, and self-referencing standards.
  - Robots meta tag directives (`noindex`, `nofollow`, `noarchive`, `nosnippet`, `noimageindex`).
  - HTTP header indexing controls (`X-Robots-Tag` for PDFs, images, and non-HTML assets).
  - Triaging Google Search Console "Page Indexing" exclusion statuses.
  - Soft 404 error remediation and parameter duplicate consolidation.
- **Out-of-Scope**:
  - Bot crawl rate limits and crawl trap blockage (Handled by [Crawling](../Crawling/SKILL.md) and [RobotsTXT](../RobotsTXT/SKILL.md)).
  - Server-level 301 redirection rules (Handled by [Redirects](../Redirects/SKILL.md)).
  - XML sitemap cleanups (Handled by [XML Sitemaps](../XML%20Sitemaps/SKILL.md)).

## D. Required Inputs
1. **Target URL or Domain**: Destination document.
2. **Google Search Console Page Indexing Report**: Full CSV export of indexed vs. excluded URLs with error breakdown.
3. **Live HTML Source Markup**: Rendered `<head>` block containing canonical and meta robots tags.
4. **HTTP Response Headers**: Raw response headers inspecting `X-Robots-Tag`.

## E. Required Tools and Data Sources
- **Commercial Tooling**: Screaming Frog SEO Spider (Canonicals tab, Directives tab, GSC API integration), Ahrefs Site Audit.
- **Zero-Cost / Open Source Alternatives**:
  - Google Search Console URL Inspection API / web UI.
  - Unix CLI: `curl -I -s https://example.com/page | grep -i -E "x-robots-tag|link"`
  - Chrome DevTools Network Tab / View-Source.
  - Python scripts parsing HTML `<meta name="robots">` and `<link rel="canonical">`.

## F. Core Concepts and Decision Principles
1. **Crawling vs. Indexing (The Fundamental Separation)**:
   - Blocking a page in `robots.txt` does **NOT** prevent indexing. If external or internal links point to a disallowed URL, Google can index the bare URL without content based on anchor text alone.
   - To guarantee a page is completely removed from the index, Googlebot **must be allowed to crawl the page** so it can read the `<meta name="robots" content="noindex">` tag or receive an HTTP 404/410 status.
2. **Canonical Tags are Hints, Not Directives**:
   - Unlike `noindex` (which is a strict command), `rel="canonical"` is an algorithmic **hint**.
   - If Page A points its canonical tag to Page B, but Page A has 500 external backlinks, high internal PageRank, and unique content, Google’s machine learning systems may override your tag and select Page A as the canonical URL ("Google-selected canonical").
3. **Self-Referencing Canonicals as a Standard**:
   - Every clean, standalone indexable page **MUST** feature a self-referencing canonical tag pointing directly to its own absolute URL:
     ```html
     <!-- On https://example.com/solutions/cloud/ -->
     <link rel="canonical" href="https://example.com/solutions/cloud/" />
     ```
   - This prevents duplicate indexation caused by tracking parameters (`?utm_source=twitter`), session IDs, or trailing slash inconsistencies.

## G. Operational Workflow

```
[Extract GSC Page Indexing Exclusion Report] -> [Group URLs by Exclusion Reason]
                     |                                         |
                     v                                         v
       [Inspect Raw HTTP Headers & DOM] -> [Audit Canonical Consistency]
                     |                                         |
                     v                                         v
   [Apply Remediation (Content/Technical)] -> [Submit Validation in GSC]
```

### Step 1: Triage GSC Page Indexing Exclusion Categories
Export the exclusion table from GSC > Indexing > Pages. Classify the issues into operational buckets:

| GSC Exclusion Reason | Underlying Root Cause | Architectural Solution |
| :--- | :--- | :--- |
| **Discovered - currently not indexed** | Quality / Crawl Budget issue. Google knows the URL exists but hasn't prioritized crawling it. | Improve internal link depth; build topical authority; verify server TTFB. |
| **Crawled - currently not indexed** | Content Quality / Thin Content. Google crawled the page but decided it does not meet the quality threshold to store in the index. | Execute [Gap Analysis](../../Content%20Optimization/Gap%20Analysis/SKILL.md); add unique data and media; merge thin pages. |
| **Duplicate without user-selected canonical** | Multiple URLs serve similar content without declaring a canonical tag. | Inject explicit self-referencing canonical or point to master page. |
| **Duplicate, Google chose different canonical** | Your canonical tag pointed to URL A, but Google chose URL B due to stronger signals. | Synchronize internal links, sitemaps, and redirects to reinforce your preferred canonical. |
| **Soft 404** | A blank, thin, or error page that returns HTTP 200 OK instead of HTTP 404 Not Found. | Fix server code to return true HTTP 404 or 410 status code. |

### Step 2: Implement Canonical Tag Engineering
1. Ensure the canonical link is placed inside the HTML `<head>` container (never in `<body>`).
2. Use **absolute URLs**, never relative URLs:
   - *Bad*: `<link rel="canonical" href="/blog/post/" />`
   - *Good*: `<link rel="canonical" href="https://example.com/blog/post/" />`
3. Verify that the protocol (`https://`), subdomain (`www` vs non-`www`), and trailing slash match your sitewide standard exactly.

### Step 3: Implement Meta Robots & X-Robots-Tag Directives
- **For Standard HTML Pages to Exclude**:
  ```html
  <meta name="robots" content="noindex, follow" />
  ```
  *(Note: `noindex, follow` tells Google to exclude this page from the index, but continue following its internal links to discover other pages).*
- **For Non-HTML Assets (PDFs, Images, Excel sheets)**:
  Configure your web server to deliver the `X-Robots-Tag` HTTP response header:
  ```nginx
  # Nginx: Add noindex to all PDF downloads
  location ~* \.pdf$ {
      add_header X-Robots-Tag "noindex, noarchive";
  }
  ```

### Step 4: Staging Environment De-Indexation Safeguard
To prevent catastrophic accidental indexation of staging/test environments:
1. Implement **HTTP Basic Authentication** (password protection) at the web server / CDN level. Googlebot cannot log in, ensuring 0% chance of indexation.
2. In addition, inject `<meta name="robots" content="noindex, nofollow">` across all staging HTML templates.

### Step 5: Validate via Google Search Console URL Inspection API
1. Inspect the target URL using the GSC URL Inspection tool.
2. Check:
   - **User-declared canonical**: Does it match your intended URL?
   - **Google-selected canonical**: Does it match the user-declared canonical?
   - **Indexing allowed?**: Yes/No.
3. Click "Test Live URL" to ensure that recent code deployments have resolved the error, then click "Request Indexing".

## H. Analysis and Decision Framework
Use this framework to resolve canonical mismatches:

```
                  [Canonical Mismatch Detected]
                                |
             Does Google-selected canonical match your
                   intended commercial target?
                           /          \
                        [Yes]         [No]
                         /              \
         (Update your page's tag        Why did Google pick URL B?
          to match Google's choice)          /             \
                               [URL B has more links]  [Content is 99% identical]
                                       /                     \
                             (Redirect URL B to A,   (Differentiate content
                              or update internal      on Page A to prove
                              links to point to A)    unique value)
```

## I. Prioritization Framework
Score indexing issues using the **Indexation Severity Metric (ISM)**:

$$\text{ISM} = \text{Target Page Commercial Value (1-10)} \times (\text{Accidental Noindex: 10} + \text{Soft 404: 5} + \text{Duplicate Canonical: 3})$$

Immediately triage any commercial product or core guide flagged with accidental `noindex`.

## J. Deliverables & Specifications
Deliver an **Indexation & Canonicalization Matrix**:
1. `url`: Target document path.
2. `http_status`: 200, 301, 404, or 410.
3. `meta_robots_directive`: `index, follow` vs `noindex, follow`.
4. `user_declared_canonical`: Exact absolute URI.
5. `google_selected_canonical`: GSC inspected value.
6. `gsc_indexing_status`: Indexed, Excluded (Discovered), Excluded (Crawled), or Error.
7. `action_plan`: Content enhancement, canonical alignment, or header adjustment.

## K. Quality Assurance Checklist
- [ ] Canonical tag is an absolute URL with correct `https` protocol and trailing slash.
- [ ] No page contains both `<meta name="robots" content="noindex">` AND `<link rel="canonical">` pointing to a different page (conflicting directives).
- [ ] Canonical tags are located inside the `<head>` element, before any iframe or broken script tags that force premature `<body>` closure.
- [ ] Staging and testing domains are secured behind HTTP Basic Auth.
- [ ] XML Sitemap contains ONLY 100% indexable, 200 OK, canonical URLs.

## L. Failure Modes and Anti-Patterns
- **The Staging Push Disaster**: Copying the production database to staging, forgetting to add password protection, and having Google index your entire staging site on `staging.example.com`, causing massive duplicate content cannibalization.
- **The Robots.txt Noindex Myth**: Adding `Noindex: /page` inside `robots.txt`. Google formally deprecated robots.txt noindex in 2019; it is completely ignored.
- **Circular Canonical Chains**: Page A canonicalizes to Page B, and Page B canonicalizes back to Page A. Google ignores both tags and chooses randomly.

## M. AI-Agent Operating Instructions
1. An AI agent must parse both raw HTML source and live HTTP headers (`curl -I`) to verify `X-Robots-Tag` and `<meta name="robots">` consistency.
2. Ensure canonical tags generated by automated scripts always output absolute URIs matching the verified domain canonical scheme.
3. Automatically flag any page that is marked `noindex` but simultaneously listed in the XML sitemap.

## N. Success Metrics & Verification Windows
- **Indexation Velocity**: New published canonical URLs index in Google within 72 hours of publication.
- **Error Eradication**: 0 Soft 404 errors and 0 "Duplicate without user-selected canonical" warnings in GSC Page Indexing reports.

## O. Related Skills
- **Upstream Input**: [Crawling](../Crawling/SKILL.md), [URL Optimization](../../On-page%20SEO/URL%20Optimization/SKILL.md)
- **Direct Controls**: [RobotsTXT](../RobotsTXT/SKILL.md), [XML Sitemaps](../XML%20Sitemaps/SKILL.md)
- **Server Mechanics**: [Redirects](../Redirects/SKILL.md)

## P. Authoritative References
- [Google Search Central: Canonicalization Overview](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) — How Google consolidates duplicate URLs and selects canonicals.
- [Google Search Central: Robots Meta Tag Specifications](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) — Complete technical specification for `noindex`, `nofollow`, and `X-Robots-Tag`.
- [RFC 6596: The Canonical Link Relation](https://datatracker.ietf.org/doc/html/rfc6596) — The formal internet standards RFC for `rel="canonical"`.

## Q. Maintenance and Review Cycle
- **Bi-Weekly GSC Indexing Audit**: Review the Page Indexing report every 14 days to catch newly reported "Crawled - currently not indexed" URLs before traffic erosion occurs.
