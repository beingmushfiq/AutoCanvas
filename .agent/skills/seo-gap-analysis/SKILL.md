---
name: seo-gap-analysis
description: Competitive semantic intersection, missing topical subtopic discovery, and search intent alignment to achieve complete domain authority.
metadata:
  category: Content Optimization
  discipline: Semantic Engineering
  version: "1.0.0"
---

# Content Gap Analysis

## A. Purpose
The Content Gap Analysis skill governs the discovery, quantification, and mapping of missing topical concepts, subheadings, and search queries that competitors successfully rank for but the target domain overlooks. Search engines reward topical completeness: a domain or individual article that comprehensively addresses every facet of a core entity is algorithmically recognized as an authoritative resource. This skill provides an auditable methodology for cross-referencing competitive keyword profiles, identifying high-value semantic voids, and translating discovered gaps into actionable content updates or new dedicated URLs.

## B. Trigger Conditions
Invoke this skill when:
1. An existing article or category page ranks on page 2 or 3 (positions 11-30) and has plateaued despite possessing equal or superior backlink metrics.
2. Formulating a comprehensive topical authority map to challenge an entrenched competitor.
3. Conducting a quarterly content audit to identify emerging topics competitors have recently published.
4. Planning a site expansion or new content pillar to capture missing audience market share.

Upstream dependencies: [SERP Analysis](../../Keyword%20Research/SERP%20Analysis/SKILL.md) and [Search Console](../../Analytics/Search%20Console/SKILL.md).

## C. Scope and Boundaries
- **In-Scope**:
  - Competitive domain-level and page-level keyword intersection audits.
  - Subtopic and semantic entity extraction from top 3 ranking competitor documents.
  - Differentiating "True Content Gaps" (valuable user needs) from "Boilerplate Noise".
  - Routing discovered gaps into existing page updates vs. new URL creation.
- **Out-of-Scope**:
  - Natural language salience scoring and BM25 modeling (Handled by [NLP Optimization](../NLP%20Optimization/SKILL.md)).
  - Direct sentence-level copywriting (Handled by [Readability](../Readability/SKILL.md)).
  - External backlink gap analysis (Handled by [Ahrefs](../../SEO%20Tools/Ahrefs/SKILL.md) and [SEMrush](../../SEO%20Tools/SEMrush/SKILL.md)).

## D. Required Inputs
1. **Target URL or Domain**: The asset being optimized.
2. **Top 3 Direct Competitor URLs**: The exact high-ranking competitor URLs outranking your asset for the primary target query.
3. **Primary Topic / Seed Keyword**: The overarching entity or category.
4. **Current GSC Query Export**: Existing ranking queries for the target page.

## E. Required Tools and Data Sources
- **Commercial Tooling**: Ahrefs Content Gap tool, Semrush Keyword Gap tool, Surfer SEO / Clearscope (topical coverage models).
- **Zero-Cost / Open Source Alternatives**:
  - Python scripts using BeautifulSoup to scrape competitor heading outlines (H1, H2, H3) and compute text set differences.
  - Google Search Console performance queries compared against Google Search Suggest outputs.
  - Diff tools (`diff`, `wdiff`, or Python `difflib`) to cross-examine text corpora.

## F. Core Concepts and Decision Principles
1. **Domain Gap vs. Page-Level Gap**:
   - *Domain-Level Gap*: Entire topics, categories, or buyer stages that your website does not cover at all (e.g., your competitor has a comprehensive "PostgreSQL Migration" section with 20 guides, while your site has none).
   - *Page-Level Gap*: Specific subheadings, questions, or technical details that your competitor answers inside their guide, but your guide omits (e.g., your guide omits "WAL Archiving Compression Options").
2. **The "Checklist Copying" Anti-Pattern**:
   - A content gap analysis is **not** an instruction to mindlessly copy every single subtopic your competitor wrote about. If a competitor wrote 500 words on the history of computers in a guide on cloud backups, that is not a useful gap; it is useless filler.
   - Gaps are only valid if they satisfy a **genuine searcher need** or clarify an ambiguous technical step.
3. **Information Gain Differentiation**:
   - Closing content gaps merely achieves *parity* with existing search results. To achieve *superiority*, you must close the gap and then introduce an **Information Gain Asset** (e.g., proprietary benchmark data, original code, interactive calculator, or clear comparison table) that competitors lack.

## G. Operational Workflow

```
[Select Target URL & 3 Competitor URLs] -> [Extract Heading Hierarchies & Corpus]
                     |                                         |
                     v                                         v
       [Run Set Difference Analysis] -> [Filter for High-Intent Semantic Gaps]
                     |                                         |
                     v                                         v
   [Classify: New Page vs. Section Update] -> [Produce Content Brief Specification]
```

### Step 1: Scrape Competitor Structural Outlines
Extract the heading trees and unique subtopics from the top 3 ranking URLs:
```python
from bs4 import BeautifulSoup
import requests

def extract_headings(url):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    html = requests.get(url, headers=headers).text
    soup = BeautifulSoup(html, 'html.parser')
    headings = [h.get_text().strip() for h in soup.find_all(['h2', 'h3'])]
    return set(headings)

my_headings = extract_headings("https://example.com/my-postgres-guide")
comp1_headings = extract_headings("https://competitor.com/postgres-guide")

# Identify subheadings present in competitor but missing from own page
missing_subheadings = comp1_headings - my_headings
print(f"Discovered {len(missing_subheadings)} potential subtopic gaps.")
```

### Step 2: Commercial Tool Matrix Intersection (Ahrefs / Semrush)
If commercial tooling is available:
1. Open the Content Gap tool.
2. Enter Competitor 1, Competitor 2, and Competitor 3 in the "Show keywords that any of the targets rank for" fields.
3. Enter your own target URL in the "But the following target does not rank for" field.
4. Filter by:
   - Intersection: Ranked by at least 2 of the 3 competitors.
   - Volume: $\ge 50$.
   - Target Rank: Competitors rank in Top 10.

### Step 3: Classify Gaps into Architectural Destinations
Evaluate each discovered gap using the **Routing Rule**:
- **Case 1: Micro-Gap (Subtopic / Specific Question)**:
  - If the gap query has low search volume ($< 200/\text{mo}$) and directly relates to the main topic (e.g., `postgresql backup retention policy`), add a dedicated H2/H3 subsection to the existing page.
- **Case 2: Macro-Gap (Independent Intent / Complex Entity)**:
  - If the gap query has moderate-to-high volume ($> 500/\text{mo}$) and represents a distinct decision funnel or separate product (e.g., `postgresql point in time recovery step by step`), spin it off into a dedicated standalone URL and link it back to the pillar page.

### Step 4: Assemble the Content Expansion Specification
Synthesize the verified gaps into an actionable editorial brief detailing:
1. The exact subheadings to inject.
2. The primary questions to answer in the first 2 sentences under each heading.
3. The technical evidence (code snippets, terminal commands, configuration tables) required to fulfill the user's intent.

## H. Analysis and Decision Framework
Use this framework to filter discovered gaps:

```
                  [Discovered Competitor Subtopic]
                                 |
                 Does it serve the target reader's goal?
                            /            \
                         [Yes]           [No]
                          /                \
          Does the topic require more      (Discard: Competitor filler)
          than 800 words to answer properly?
                    /          \
                 [Yes]         [No]
                  /              \
        (Create New URL &      (Add H2/H3 Section to
         Link from Pillar)      Existing Document)
```

## I. Prioritization Framework
Rank discovered content gaps using the **Gap Impact Score (GIS)**:

$$\text{GIS} = \sum (\text{Competitor Monthly Search Volume}) \times \text{Topical Relevance Multiplier (1-5)}$$

Prioritize subtopics where at least 2 competitors rank in the top 5 with substantial aggregate volume.

## J. Deliverables & Specifications
Deliver a **Content Gap Remediation Brief**:
1. `target_url`: The page being updated.
2. `competitor_urls_audited`: List of 3 reference URLs.
3. `missing_subtopics_to_add`: Exact list of new H2/H3 sections.
4. `new_urls_to_create`: List of distinct spinoff topics requiring standalone pages.
5. `information_gain_requirement`: The proprietary angle, benchmark, or visual asset that surpasses competitor depth.

## K. Quality Assurance Checklist
- [ ] Gaps are not based on generic fluff or competitor off-topic musings.
- [ ] Verified that adding new subtopics will not cause keyword cannibalization with another page on your own website.
- [ ] All new subtopics are supported by factual, technically accurate information.
- [ ] Existing internal links are identified to connect the updated sections to related content.

## L. Failure Modes and Anti-Patterns
- **The Competitor Cloning Trap**: Mindlessly copying a competitor’s outline word-for-word, creating duplicate zero-value content that fails Google's Helpful Content evaluation.
- **Diluting Page Focus**: Cramming 25 unrelated subtopics into a single article until it becomes a rambling 12,000-word monolith that satisfies nobody.
- **Ignoring Brand-Specific Sections**: Mistaking a competitor’s proprietary feature explanations for industry-wide search gaps.

## M. AI-Agent Operating Instructions
1. An AI agent must compare raw text corpora across URLs to compute semantic intersections without hallucinating competitor topics.
2. Filter out competitor company names, employee bios, and copyright text from the extracted subtopic list.
3. Generate concise, direct answer blocks for each approved missing subtopic.

## N. Success Metrics & Verification Windows
- **Keyword Breadth Expansion**: Target page begins ranking for $\ge 25$ additional secondary keywords in GSC within 30 days of updating.
- **Ranking Acceleration**: Target URL moves from Page 2 (pos 11-20) into the Top 10 within 45 days.

## O. Related Skills
- **Upstream Input**: [SERP Analysis](../../Keyword%20Research/SERP%20Analysis/SKILL.md)
- **Deep Semantic Modeling**: [NLP Optimization](../NLP%20Optimization/SKILL.md), [Entity Coverage](../Entity%20Coverage/SKILL.md)
- **Execution**: [Content Refresh](../Content%20Refresh/SKILL.md), [Headings Optimization](../../On-page%20SEO/Headings%20Optimization/SKILL.md)

## P. Authoritative References
- [Google Search Central: Creating Helpful, Reliable, People-First Content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) — How Google evaluates comprehensive, original document value.
- [Google Search Central: Guide to Search Ranking Systems](https://developers.google.com/search/docs/appearance/ranking-systems-overview) — Detailed explanation of topical authority systems.

## Q. Maintenance and Review Cycle
- **Bi-Annual Competitive Gap Audit**: Run a fresh content gap analysis every 6 months to catch newly published competitor subtopics and emerging market terminology.
