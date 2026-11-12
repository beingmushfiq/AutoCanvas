---
name: seo-page-speed
description: Core Web Vitals engineering (LCP, INP, CLS), critical rendering path optimization, font display, and CDN caching architecture.
metadata:
  category: Technical SEO
  discipline: Performance Engineering
  version: "1.0.0"
---

# Page Speed & Core Web Vitals

## A. Purpose
The Page Speed skill establishes the technical engineering discipline for measuring, diagnosing, and optimizing web performance against Google's Core Web Vitals (CWV) standards. Speed is an official Google ranking factor under the Page Experience signals. Beyond search algorithms, page latency directly controls user conversion rates: every 100ms of additional rendering delay correlates with a measurable drop in session duration, pageviews, and transactional revenue. This skill provides a deterministic methodology to optimize Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS) on real-world mobile devices.

## B. Trigger Conditions
Invoke this skill when:
1. Google Search Console flags URLs in the Core Web Vitals report as "Need Improvement" or "Poor".
2. Deploying a new frontend framework, design overhaul, or heavy JavaScript third-party script suite.
3. Conducting technical audits on high-value commercial landing pages with poor mobile conversion rates.
4. Auditing server latency and Time to First Byte (TTFB) after server migration or CDN restructuring.

Upstream dependencies: [URL Optimization](../../On-page%20SEO/URL%20Optimization/SKILL.md) and [Image SEO](../../On-page%20SEO/Image%20SEO/SKILL.md).

## C. Scope and Boundaries
- **In-Scope**:
  - Core Web Vitals 2026 standards: LCP ($\le 2.5\text{s}$), INP ($\le 200\text{ms}$), CLS ($\le 0.1$).
  - Critical Rendering Path: Minifying HTML/CSS/JS, eliminating render-blocking resources.
  - Server response optimization: Time to First Byte (TTFB $< 800\text{ms}$), HTTP/2 and HTTP/3 multiplexing.
  - Web font optimization: `font-display: swap`, WOFF2 preloading, layout shift prevention.
  - JavaScript main-thread execution auditing and script deferral (`defer` / `async`).
- **Out-of-Scope**:
  - General backend database query optimization (Handled by DBA / backend teams).
  - Graphic design alteration of visual assets (Handled by [Image SEO](../../On-page%20SEO/Image%20SEO/SKILL.md)).
  - Writing on-page copy (Handled by [Readability](../../Content%20Optimization/Readability/SKILL.md)).

## D. Required Inputs
1. **Target URL**: The page being evaluated.
2. **Chrome User Experience Report (CrUX) Field Data**: 75th percentile real-world user metrics from Google Search Console.
3. **Lighthouse / WebPageTest Lab Audit**: Detailed performance trace, visual filmstrip, and waterfall chart.
4. **Technology Stack Specs**: Hosting provider, CDN layer, CMS/Framework (Next.js, WordPress, Astro, Shopify).

## E. Required Tools and Data Sources
- **Commercial Tooling**: WebPageTest (private instance or public API: waterfall breakdown, connection metrics), DebugBear, SpeedCurve.
- **Zero-Cost / Open Source Alternatives**:
  - Google PageSpeed Insights API (extracts both CrUX Field Data and Lighthouse Lab Data).
  - Google Search Console Core Web Vitals report.
  - Chrome DevTools: Performance tab, Network tab, Coverage tab (identifies unused CSS/JS).
  - Lighthouse CLI (`npm install -g lighthouse`).

## F. Core Concepts and Decision Principles
1. **Field Data (CrUX) vs. Lab Data (Lighthouse)**:
   - **Field Data (CrUX)**: Real-world metrics collected from Chrome users over a 28-day rolling window across real mobile devices and network connections. **This is what Google uses for ranking evaluation**.
   - **Lab Data (Lighthouse)**: Synthetic single-run tests conducted on an emulated device under fixed CPU throttling. Used strictly for debugging bottlenecks. Passing Lighthouse does not guarantee passing CWV in the real world.
2. **The 3 Core Web Vitals Pillars (2026 Standards)**:
   - **Largest Contentful Paint (LCP)**: Measures *loading performance*. Marks the point when the largest text block or image in the viewport finishes rendering. **Target: $\le 2.5\text{ seconds}$ at 75th percentile**.
   - **Interaction to Next Paint (INP)**: Measures *page responsiveness*. Replaced FID in March 2024. Assesses the latency of all user interactions (clicks, taps, keypresses) during the entire page lifecycle. **Target: $\le 200\text{ milliseconds}$**.
   - **Cumulative Layout Shift (CLS)**: Measures *visual stability*. Quantifies unexpected layout shifts during page loading. **Target: $\le 0.1$**.
3. **The Critical Rendering Path**:
   Browsers cannot render pixels until the HTML is parsed, CSS is downloaded and parsed into the CSSOM, and non-deferred JavaScript is executed. Minimizing render-blocking CSS and deferring non-essential JS is mandatory for sub-second first paints.

## G. Operational Workflow

```
[Fetch CrUX Field Data via PageSpeed Insights] -> [Identify Failing Metric (LCP/INP/CLS)]
                         |                                         |
                         v                                         v
       [Run DevTools Performance Trace] -> [Isolate Render-Blocking CSS/JS Bottlenecks]
                         |                                         |
                         v                                         v
   [Apply Architectural Performance Patches] -> [Verify 28-Day CrUX Recovery in GSC]
```

### Step 1: Query PageSpeed Insights API via Python
Extract both Field (CrUX) and Lab (Lighthouse) metrics programmatically:
```python
import requests

def audit_cwv(url):
    api_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy=mobile"
    r = requests.get(api_url).json()
    
    crux = r.get('loadingExperience', {}).get('metrics', {})
    lcp = crux.get('LARGEST_CONTENTFUL_PAINT_MS', {}).get('percentile', 'N/A')
    inp = crux.get('INTERACTION_TO_NEXT_PAINT', {}).get('percentile', 'N/A')
    cls = crux.get('CUMULATIVE_LAYOUT_SHIFT_SCORE', {}).get('percentile', 'N/A')
    
    print(f"Mobile Field CrUX (75th Percentile) for {url}:")
    print(f" - LCP: {lcp} ms (Target: <= 2500 ms)")
    print(f" - INP: {inp} ms (Target: <= 200 ms)")
    print(f" - CLS: {cls / 100 if cls != 'N/A' else 'N/A'} (Target: <= 0.10)")

audit_cwv("https://example.com")
```

### Step 2: Largest Contentful Paint (LCP) Remediation
If LCP $> 2.5\text{s}$:
1. **Identify the LCP Element**: In Chrome DevTools > Performance > Timings > LCP, hover to see which DOM element is the LCP candidate (usually the hero image or H1 heading).
2. **Eliminate Resource Load Delay**:
   - Preload the LCP image in the HTML `<head>`:
     ```html
     <link rel="preload" fetchpriority="high" as="image" href="/hero.webp" type="image/webp">
     ```
   - **NEVER** lazy-load the hero image (see [Image SEO](../../On-page%20SEO/Image%20SEO/SKILL.md)).
3. **Optimize TTFB (Server Latency)**:
   - Cache HTML at the CDN edge (Cloudflare Edge Cache / Varnish). Ensure TTFB is $< 600\text{ms}$.

### Step 3: Interaction to Next Paint (INP) Remediation
If INP $> 200\text{ms}$:
1. **Identify Long Tasks**: Open DevTools Performance tab and record a trace while clicking interactive elements (dropdowns, buttons, menus). Look for red-flagged tasks exceeding $50\text{ms}$ on the main thread.
2. **Break Up Long JavaScript Tasks**:
   - Yield to the main thread using `scheduler.yield()` or `setTimeout(..., 0)`:
     ```javascript
     // Yield execution to allow browser to paint UI feedback
     async function handleUserInteraction() {
         validateInput();
         await scheduler.yield(); // Lets browser paint interaction immediately
         processHeavyData();
     }
     ```
3. **Audit Third-Party Tag Bloat**: Defer or remove non-essential tracking pixels, analytics heatmaps, and chat widgets using Google Tag Manager.

### Step 4: Cumulative Layout Shift (CLS) Remediation
If CLS $> 0.1$:
1. **Explicit Dimensions on Media**: Add `width` and `height` attributes to all `<img>`, `<video>`, and `<iframe>` elements to reserve aspect ratio layout space.
2. **Web Font Layout Jumps (FOUT / FOIT)**:
   - Use `font-display: swap` in your `@font-face` CSS declarations:
     ```css
     @font-face {
       font-family: 'Inter';
       src: url('/fonts/inter.woff2') format('woff2');
       font-display: swap;
     }
     ```
   - Preload the primary WOFF2 body font in the `<head>`:
     ```html
     <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
     ```
3. **Reserve Ad / Banner Containers**: Pre-allocate CSS `min-height` on dynamic banner or cookie consent containers so they do not push body text down when they load.

### Step 5: Critical CSS & Script Deferral
1. Inline the critical path CSS directly into the HTML `<head>` for immediate first paint.
2. Defer all non-critical external JavaScript files:
   ```html
   <script src="/js/analytics.js" defer></script>
   ```

## H. Analysis and Decision Framework
Use this framework to triage CWV failures:

```
                   [Failing Core Web Vitals Metric]
                                  |
                Which specific metric fails in CrUX?
                 /                |                 \
             [LCP > 2.5s]    [INP > 200ms]      [CLS > 0.10]
                  |               |                  |
           - Preload hero   - Break long JS     - Add width/height
           - Edge CDN cache   tasks (>50ms)       to all images
           - Defer CSS/JS   - Defer 3rd-party   - Preload WOFF2 fonts
                              scripts           - Set min-height on ads
```

## I. Prioritization Framework
Rank performance engineering interventions using the **Core Web Vitals Impact Score (CWVIS)**:

$$\text{CWVIS} = \text{Monthly Page Pageviews} \times (\text{LCP Failure: 3} + \text{INP Failure: 3} + \text{CLS Failure: 2})$$

Prioritize mobile performance on high-converting checkout and SaaS lead generation pages.

## J. Deliverables & Specifications
Deliver a **Core Web Vitals Remediation Blueprint**:
1. `url`: Target document path.
2. `crux_mobile_metrics`: Pre-optimization LCP, INP, and CLS percentiles.
3. `lcp_candidate_element`: Exact DOM selector.
4. `inp_bottlenecks`: JavaScript functions blocking main thread $> 50\text{ms}$.
5. `cls_culprits`: Elements causing layout shifts.
6. `engineering_fixes`: Exact HTML preload tags, CSS rules, or JS deferrals to implement.

## K. Quality Assurance Checklist
- [ ] LCP image has `<link rel="preload">` and `fetchpriority="high"`.
- [ ] No images above the fold feature `loading="lazy"`.
- [ ] All images and iframes contain explicit `width` and `height` integer attributes.
- [ ] All external fonts use `font-display: swap` and WOFF2 format.
- [ ] Non-critical JavaScript scripts use `defer` or `async`.
- [ ] Origin TTFB is $< 600\text{ms}$ on mobile connections.

## L. Failure Modes and Anti-Patterns
- **The "100/100 Lighthouse on Desktop" Illusion**: Testing only on high-speed fiber desktop connections while 85% of real visitors browse on throttled 4G Android devices that fail CWV.
- **Third-Party Pixel Creep**: Allowing the marketing department to inject 45 unvetted tracking scripts via Google Tag Manager, destroying INP scores.
- **Client-Side Rendering (CSR) Monoliths**: Using raw Create-React-App without SSR, delivering a 2MB JavaScript bundle that results in a 6-second blank white screen on mobile.

## M. AI-Agent Operating Instructions
1. An AI agent must pull real CrUX field metrics via the PageSpeed Insights API; never rely on single-run synthetic lab audits alone.
2. Ensure preloaded asset URLs match the exact canonical image path (including protocol and domain) to prevent double-downloading.
3. Never recommend stripping essential user functionality simply to win artificial benchmark points.

## N. Success Metrics & Verification Windows
- **Lab Validation (Day 1)**: Mobile Lighthouse Performance score reaches $\ge 85$ in synthetic staging tests.
- **CrUX Field Pass (Day 28)**: Google Search Console Core Web Vitals report transitions URLs from "Poor / Need Improvement" to "Good" across all 3 metrics within 28 days of production deployment.

## O. Related Skills
- **Media Optimization**: [Image SEO](../../On-page%20SEO/Image%20SEO/SKILL.md)
- **Infrastructure**: [Crawling](../Crawling/SKILL.md)
- **Downstream Conversion**: [Conversion Optimization](../../Growth/Conversion%20Optimization/SKILL.md)

## P. Authoritative References
- [Google Search Central: Core Web Vitals and Search Results](https://developers.google.com/search/docs/appearance/core-web-vitals) — Official documentation on CWV as a ranking signal.
- [web.dev: Optimize INP (Interaction to Next Paint)](https://web.dev/articles/optimize-inp) — Detailed engineering guide on main-thread responsiveness and yielding.
- [W3C Navigation Timing Level 2](https://www.w3.org/TR/navigation-timing-2/) — Technical specification for web performance metrics.

## Q. Maintenance and Review Cycle
- **Monthly CWV CrUX Review**: Audit the GSC Core Web Vitals report every 30 days to catch regressions introduced by frontend releases or marketing tag additions.
