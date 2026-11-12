---
name: seo-orchestrator
description: Master SEO orchestrator, symptom triage engine, and multi-skill dispatch director. Diagnoses organic traffic drops, Google Search Console indexing anomalies, Core Web Vitals regressions, Schema.org structured data errors, and directs queries to specialized Everything SEO skills.
metadata:
  category: SEO Tools
  discipline: Technical Auditing & Autonomous Routing
  version: "1.0.0"
---

# Master SEO Orchestrator & Autonomous Triage Engine

## A. Purpose
The Master SEO Orchestrator skill establishes the Level-1 supervisory intelligence and automated routing engine for the Everything SEO library. In enterprise environments and multi-disciplinary development workflows, search engine anomalies rarely present as isolated single-variable problems. A sudden decline in organic traffic or search impressions could stem from server-level rendering timeouts, accidental `noindex` injections, canonical loops, robots.txt blocking, Core Web Vitals degradation, or Google algorithmic updates. The SEO Orchestrator provides a deterministic, citational diagnostic framework that analyzes user symptoms, inspects codebase artifacts, resolves ambiguity, and dispatches the exact specialized operational manual from the 55-skill Everything SEO catalog.

## B. Trigger Conditions
Invoke this skill when:
1. The user presents an open-ended, ambiguous, or multi-symptom SEO inquiry (e.g., *"Our organic traffic dropped 40% after Tuesday's deploy"*, *"How do I optimize our Next.js application for search?"*).
2. Auditing a website prior to launch, domain migration, or major architectural rewrite where multiple disciplines intersect.
3. Multiple conflicting diagnostic signals exist (e.g., Google Search Console reports "Indexed, though blocked by robots.txt" or "Page with redirect has canonical conflict").
4. An automated CI/CD pipeline or pull request requires a holistic SEO health check across technical, structural, and performance boundaries.
5. The operator explicitly invokes the master triage command `/seo-orchestrator` or `/seo-triage`.

Upstream dependencies: None (Acts as the Level-1 entrypoint). Downstream dependencies: All 55 specialist skills across Technical SEO, On-page SEO, Content Optimization, Link Building, AI SEO, International SEO, Analytics, SEO Tools, Keyword Research, SEO Wins, and Growth.

## C. Scope and Boundaries
- **In-Scope**:
  - Semantic intent analysis of incoming natural language SEO queries and symptoms.
  - Multi-tier diagnostic decision matrix mapping symptoms to primary and secondary specialist skills.
  - Codebase artifact inspection (e.g., checking `robots.txt`, `sitemap.xml`, `<meta name="robots">`, `next.config.js`, `package.json`, `.cursor/rules/`).
  - Formulating prioritized, sequential action plans that chain multiple specialist skills in logical order.
  - Continuous alignment with Google Search Essentials, RFC 9309, Schema.org, and W3C Web Performance standards.
- **Out-of-Scope**:
  - Deep single-domain remediation procedures (Delegated directly to specialized skills such as [Indexing](../../Technical%20SEO/Indexing/SKILL.md), [Schema Markup](../../On-page%20SEO/Schema%20Markup/SKILL.md), or [Page Speed](../../Technical%20SEO/Page%20Speed/SKILL.md)).
  - Direct execution of destructive codebase operations without operator consent.

## D. Required Inputs
1. **User Problem Statement or Symptom**: Description of the issue, observed anomaly, or desired optimization goal.
2. **Target Domain or Repository Context**: Live URL, staging environment, or local workspace file tree.
3. **Observability Evidence (If Available)**:
   - Google Search Console performance / coverage CSV exports.
   - Server access logs or HTTP response status codes.
   - Core Web Vitals field data (CrUX) or Lighthouse performance traces.
   - Git commit history or release changelogs surrounding the observed drop.

## E. Required Tools and Data Sources
- **Everything SEO CLI**: `everything-seo triage <symptom>` (Node.js) or `python -m everything_seo_cli.cli triage <symptom>` (Python).
- **Everything SEO MCP Server**: Tool `triage_seo_problem` and `list_seo_skills`.
- **Zero-Cost Inspection Utilities**:
  - `curl -I -s -A "Googlebot" https://example.com` (inspecting HTTP response headers and `X-Robots-Tag`).
  - Chrome DevTools Network and Performance panels.
  - Google Search Console URL Inspection API.

## F. Core Concepts and Decision Principles
1. **The 5-Phase Diagnostic Lifecycle**:
   - *Phase 1: Ingestion & Symptom Extraction* — Parse the user prompt for explicit error codes (404, 500, 301), metrics (LCP, INP, CTR), entities, and timeframe.
   - *Phase 2: Signal Triangulation* — Check whether the symptom is Technical (infrastructure/crawling/indexing), On-Page (metadata/structure), Content (quality/decay), or Off-Page (backlinks/penalties).
   - *Phase 3: Specialist Skill Dispatch* — Load the exact `.agent/skills/seo-<slug>/SKILL.md` manual.
   - *Phase 4: Remediation Plan Formulation* — Produce atomic, auditable code or configuration diffs.
   - *Phase 5: Pre-Flight Verification* — Test changes against the specialist skill's Section E checklist.
2. **The Fundamental Crawling vs. Indexing Distinction**:
   - `robots.txt` governs *crawling* (bot bandwidth access). It does NOT prevent indexing.
   - Meta `noindex` and HTTP `X-Robots-Tag` govern *indexing* (presence in Google's database). Googlebot must crawl a page to read the `noindex` directive.
3. **Root Cause Hierarchy (The Waterflow Principle)**:
   - Technical infrastructure errors (DNS, 5xx server errors, robots.txt bot blocking) supersede content and keyword optimization. Never optimize keywords on a page that Googlebot cannot crawl or index.

## G. Operational Workflow

```
                  [User Prompt / Diagnostic Inquiry]
                                  │
                                  ▼
                [Phase 1: Parse Symptom & Context]
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
      [Exact Symptom Match]             [Ambiguous / Broad Query]
      - 404 / Redirect Loop             - "Traffic dropped 40%"
      - Schema JSON-LD error            - "Improve our SEO"
      - LCP / INP > 2.5s                - "Audit website"
                 │                                 │
                 │                                 ▼
                 │                   [Run Forensic Triage Engine]
                 │                   - Check GSC coverage dates
                 │                   - Check robots.txt & headers
                 │                   - Triangulate blast radius
                 │                                 │
                 └────────────────┬────────────────┘
                                  ▼
                 [Phase 3: Dispatch Specialist Skill]
        - Technical: seo-indexing, seo-crawling, seo-robotstxt, seo-redirects
        - On-Page:   seo-schema-markup, seo-title, seo-internal-linking
        - Content:   seo-content-refresh, seo-entity-optimization
        - AI Search: seo-ai-search-visibility, seo-ai-citations
        - Speed:     seo-page-speed, seo-search-console
                                  │
                                  ▼
                [Phase 4: Execute Section D Protocol]
                                  │
                                  ▼
                [Phase 5: Pre-Flight Verification Audit]
```

### Step 1: Execute Forensic Symptom Triage
Evaluate the user inquiry against the Symptom Triage Decision Matrix (Section H). If using the CLI or MCP server, run:
```bash
everything-seo triage "<symptom description>"
```

### Step 2: Formulate Multi-Skill Execution Chain
When multiple disciplines are implicated, order the skills by technical dependency:
1. **Infrastructure Gate**: `seo-robotstxt` -> `seo-crawling` -> `seo-redirects`
2. **Indexation Gate**: `seo-indexing` -> `seo-xml-sitemaps` -> `seo-search-console`
3. **Rendering & Speed Gate**: `seo-page-speed` -> `seo-screaming-frog`
4. **Semantic Gate**: `seo-schema-markup` -> `seo-internal-linking` -> `seo-title`
5. **Growth & AI Gate**: `seo-ai-search-visibility` -> `seo-content-refresh`

## H. Analysis and Decision Framework (Triage Mapping Table)

| Observed Symptom / Query String | Primary Skill Slug | Secondary Skill Slug | Action Protocol |
| :--- | :--- | :--- | :--- |
| **"Discovered - currently not indexed"** | `seo-indexing` | `seo-internal-linking` | Audit internal link equity and content quality thresholds. |
| **"Crawled - currently not indexed"** | `seo-indexing` | `seo-content-refresh` | Inspect duplicate content, thin value, and canonical tags. |
| **"Googlebot blocked" or "robots.txt error"** | `seo-robotstxt` | `seo-crawling` | Validate RFC 9309 directive syntax and Disallow patterns. |
| **"Traffic dropped after redesign / migration"**| `seo-redirects` | `seo-indexing` | Audit 301 redirect map coverage, 404 logs, and canonical drift. |
| **"Core Web Vitals failing" or "Slow LCP / INP"**| `seo-page-speed` | `seo-screaming-frog` | Profile server TTFB, render-blocking JS, and main-thread tasks. |
| **"Rich Results not showing" / "Schema error"** | `seo-schema-markup` | `seo-title` | Validate JSON-LD syntax against Schema.org and Google Rich Results. |
| **"How to appear in ChatGPT / Perplexity"** | `seo-ai-search-visibility`| `seo-ai-citations` | Optimize information gain, authoritative citations, and entities. |
| **"Orphan pages" or "Pellucid internal structure"**| `seo-internal-linking` | `seo-xml-sitemaps` | Map sitewide click depth and inject contextual contextual inlinks. |
| **"Hreflang errors" or "Multilingual targeting"** | `seo-hreflang` | `seo-international-seo`| Audit bidirectional hreflang tags, self-referencing and x-default. |
| **"Organic traffic decay" / "Outdated articles"** | `seo-content-refresh` | `seo-entity-optimization`| Identify rotting URLs and re-anchor with contemporary statistics. |
| **"Keyword cannibalization"** | `seo-keyword-discovery` | `seo-internal-linking` | Consolidate competing pages or delineate distinct search intents. |

## I. Prioritization Framework
Score triage findings using the **SEO Urgency-Impact Coefficient (UIC)**:

$$\text{UIC} = \frac{\text{Severity Score (1 to 10)} \times \text{Organic Revenue Share (\%)}}{\text{Engineering Remediation Hours}}$$

- **P0 Critical (UIC $\ge$ 5.0)**: Sitewide crawl blockages, accidental `noindex` on money pages, broken checkout redirects. Must fix within 4 hours.
- **P1 High (UIC 2.0 to 4.9)**: Severe Core Web Vitals regressions, broken Schema on high-CTR product pages, high-value 404 links. Fix in current sprint.
- **P2 Medium (UIC 1.0 to 1.9)**: Title tag truncation, missing alt attributes, stale blog posts. Schedule for maintenance cycle.

## J. Deliverables & Specifications
When acting as the SEO Orchestrator, deliver a structured **Forensic SEO Triage & Remediation Plan**:
1. **Executive Summary**: Identified root cause, affected URLs, and revenue/traffic blast radius.
2. **Skill Dispatch Map**: Explicit declaration of primary and secondary skills loaded (`seo-<slug>`).
3. **Step-by-Step Remediation Sequence**: Ordered atomic actions referencing exact sections of each specialist skill.
4. **Pre-Flight Verification Protocol**: Deterministic checklist to execute before deploying changes.

## K. Quality Assurance Checklist
- [ ] Root cause verified against live HTTP headers or Google Search Console exports.
- [ ] Crawling vs. Indexing separation explicitly confirmed (did not confuse robots.txt with noindex).
- [ ] Primary and secondary skills loaded from `.agent/skills/seo-<slug>/SKILL.md`.
- [ ] Remediation steps avoid destructive file overwrites without operator approval.
- [ ] Changes validated using test suites or mock HTTP requests.

## L. Failure Modes and Anti-Patterns
- **The Blind Prescriber**: Guessing the root cause of a traffic drop without inspecting HTTP status codes, GSC coverage data, or robots.txt.
- **The Monolithic Dump**: Dumping all 55 skill manuals into the AI context simultaneously, overflowing token windows and confusing the agent.
- **The Premature Optimizer**: Tuning meta descriptions or keyword density on pages that are returning HTTP 500 or blocked in `robots.txt`.

## M. AI-Agent Operating Instructions
1. When an open-ended SEO question is received, immediately evaluate the prompt against Section H.
2. If the inquiry is clear, load the specific `.agent/skills/seo-<slug>/SKILL.md` directly.
3. If the inquiry is multi-faceted or ambiguous, execute a diagnostic triage run, cite the primary candidate skills, and present the structured diagnosis to the user.
4. Always prefix slash command recommendations with `/seo-` (e.g. `/seo-indexing`, `/seo-schema-markup`).

## N. Success Metrics & Verification Windows
- **Triage Accuracy**: >95% first-pass correlation between diagnosed root cause and actual technical resolution.
- **Zero Hallucinated Standards**: 100% adherence to official RFC 9309, Google Search Essentials, and Schema.org specifications.

## O. Related Skills
- **Core Triage Suite**: [Indexing](../../Technical%20SEO/Indexing/SKILL.md), [Crawling](../../Technical%20SEO/Crawling/SKILL.md), [RobotsTXT](../../Technical%20SEO/RobotsTXT/SKILL.md), [Redirects](../../Technical%20SEO/Redirects/SKILL.md)
- **On-Page Suite**: [Schema Markup](../../On-page%20SEO/Schema%20Markup/SKILL.md), [Title](../../On-page%20SEO/Title/SKILL.md), [Internal Linking](../../On-page%20SEO/Internal%20Linking/SKILL.md)
- **Performance & AI Suite**: [Page Speed](../../Technical%20SEO/Page%20Speed/SKILL.md), [AI Search Visibility](../../AI%20SEO/AI%20Search%20Visibility/SKILL.md)

## P. Authoritative References
- [Google Search Central Documentation](https://developers.google.com/search/docs) — Official search developer guidelines.
- [RFC 9309: Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html) — Authoritative robots.txt specification.
- [Schema.org Community Vocabulary](https://schema.org) — Structured data standards.

## Q. Maintenance and Review Cycle
- **Quarterly Algorithm Review**: Update triage decision trees whenever Google announces core algorithm updates or introduces new search features (e.g., AI Overviews, Search Generative Experience).
