---
name: seo-ai-entity-optimization
description: Structuring brand and product entities for LLM vector embeddings, Wikidata reconciliation, Knowledge Graph authority, and RAG ingestion.
metadata:
  category: AI SEO
  discipline: Entity Architecture
  version: "1.0.0"
---

# Entity Optimization for AI & Knowledge Graphs

## A. Purpose
The Entity Optimization for AI skill establishes the technical architecture required to ensure a company, its executives, and its products are recognized as verified, authoritative entity nodes within global Knowledge Graphs and Large Language Model (LLM) training corpora. Generative AI engines and neural search algorithms do not evaluate brands based on raw keywords; they evaluate the **semantic entity footprint**: relationships, attributes, co-citations, and authoritative third-party consensus. This skill provides an auditable protocol to establish Wikidata reconciliation, claim Knowledge Panels, structure authoritative corporate metadata, and anchor the brand firmly in AI memory.

## B. Trigger Conditions
Invoke this skill when:
1. Generative AI engines (ChatGPT, Gemini, Perplexity) hallucinate incorrect founders, headquarters, pricing, or product features about your brand.
2. The brand lacks a Google Knowledge Panel on branded navigational searches despite possessing substantial market presence.
3. Conducting an enterprise brand repositioning or corporate rebranding campaign.
4. Launching new proprietary software products that need to be disambiguated from generic technology terms in AI retrieval.

Upstream dependencies: [Entity Coverage](../../Content%20Optimization/Entity%20Coverage/SKILL.md) and [Schema Markup](../../On-page%20SEO/Schema%20Markup/SKILL.md).

## C. Scope and Boundaries
- **In-Scope**:
  - Building and verifying Wikidata entity claims (QIDs) adhering to Wikipedia notability criteria.
  - Sourcing authoritative corporate entity registries (Crunchbase, PitchBook, LinkedIn, SEC/Companies House).
  - Cross-platform entity reconciliation via Schema.org `Organization` markup and `sameAs` arrays.
  - Triggering and claiming official Google Knowledge Panels.
  - Aligning brand attributes in public ontologies to ensure accurate RAG retrieval by AI engines.
- **Out-of-Scope**:
  - Day-to-day social media management (Handled by Social Media teams).
  - Direct prompt testing and AI search visibility benchmarking (Handled by [AI Search Visibility](../AI%20Search%20Visibility/SKILL.md)).
  - On-page content gap analysis (Handled by [Gap Analysis](../../Content%20Optimization/Gap%20Analysis/SKILL.md)).

## D. Required Inputs
1. **Legal Corporate Entity Data**: Exact registered name, founding year, founders, CEO, headquarters location, DUNS number, or corporate registry ID.
2. **Canonical Corporate URLs**: Official homepage, About page, Contact page, Executive bio pages.
3. **Third-Party Entity Footprint**: Active profiles on Crunchbase, LinkedIn, Wikipedia/Wikidata (if existing), GitHub organization, and major review platforms (G2, Capterra).

## E. Required Tools and Data Sources
- **Commercial Tooling**: InLinks Knowledge Graph Manager, WordLift (Custom Knowledge Graph builder), Google Knowledge Graph Search API.
- **Zero-Cost / Open Source Alternatives**:
  - Wikidata Query Service (`query.wikidata.org`) and Wikidata item creation tools.
  - Google Search Console (Verification of corporate identity ownership for Knowledge Panel claiming).
  - OpenCorporates / SEC EDGAR / Companies House official registries.
  - Python scripts querying Google's Knowledge Graph Search API (`kgsearch.googleapis.com`).

## F. Core Concepts and Decision Principles
1. **The Knowledge Graph Authority Consensus**:
   - Google and LLMs do not simply trust what a company writes on its own homepage. If you declare yourself "The #1 Global Leader in Database Security", search engines treat that as unverified marketing copy.
   - Algorithms verify entity facts by cross-referencing multiple **independent, authoritative third-party semantic nodes**:
     - *Wikidata / Wikipedia*: The universal open semantic backbone.
     - *Crunchbase / PitchBook*: Corporate funding, acquisitions, and executive leadership.
     - *Government Registries (SEC/EDGAR)*: Official legal incorporation and headquarters.
     - *Industry Standards / Patents*: Official technical authorship and patents filed.
2. **The `sameAs` Identity Web**:
   - By explicitly linking all external profiles together using `sameAs` in JSON-LD on your homepage and About page, you form an unbroken identity graph:
     ```
     [Your Domain] <---> [Wikidata QID] <---> [Crunchbase] <---> [LinkedIn] <---> [Wikipedia]
     ```
   - This eliminates algorithmic ambiguity and prevents AI models from confusing your brand with homonyms.
3. **Wikidata Notability Compliance**:
   - Creating a Wikidata item requires adhering to Wikidata’s notability policy: the entity must be verifiable via independent reliable sources (e.g. major news coverage, books, or scientific publications). Spamming promotional claims on Wikidata leads to immediate administrative deletion.

## G. Operational Workflow

```
[Audit Brand Entity in Google Knowledge Graph API] -> [Reconcile Third-Party Profile Consistency]
                        |                                                   |
                        v                                                   v
   [Create/Update Canonical Wikidata QID Node] -> [Inject Multi-Node sameAs Schema.org Block]
                        |                                                   |
                        v                                                   v
     [Claim & Verify Google Knowledge Panel] -> [Monitor Entity Ingestion in LLM Weights]
```

### Step 1: Query Google Knowledge Graph Search API
Audit how Google currently perceives your brand using Python:
```python
import requests
import json

API_KEY = "YOUR_GOOGLE_API_KEY"
query = "DevCenterPoint"
url = f"https://kgsearch.googleapis.com/v1/entities:search?query={query}&key={API_KEY}&limit=1&indent=True"

resp = requests.get(url).json()
if 'itemListElement' in resp and len(resp['itemListElement']) > 0:
    entity = resp['itemListElement'][0]['result']
    print(f"Recognized Entity Name: {entity.get('name')}")
    print(f"Entity ID: {entity.get('@id')}")
    print(f"Types: {entity.get('@type')}")
    print(f"Description: {entity.get('description')}")
    print(f"Knowledge Graph Score: {resp['itemListElement'][0].get('resultScore')}")
else:
    print(f"Entity '{query}' is NOT currently recognized in the Google Knowledge Graph.")
```

### Step 2: Standardize External Entity Profiles
Audit all third-party profiles to ensure **100% data consistency**:
- Company Legal Name (exact spelling).
- Headquarters Address.
- Founding Year.
- Key Executives and Exact Titles.
- Core Industry Classification (e.g., "Computer Software", "Cybersecurity").
*Inconsistencies (e.g., Crunchbase listing 2020 as founding year while LinkedIn lists 2021) confuse entity resolution algorithms.*

### Step 3: Authoritative Wikidata Item Creation
If your brand meets Wikidata notability criteria:
1. Navigate to Wikidata.org > "Create a new Item".
2. Add the English label: `[Company Name]`.
3. Add a concise, non-promotional description: `American software company developing database backup tools`.
4. Add essential Statements with verifiable citation references:
   - `instance of (P31)`: `business (Q4830453)` or `software company (Q7397)`.
   - `inception (P571)`: `[Year]`.
   - `official website (P856)`: `https://example.com/`.
   - `headquarters location (P159)`: `[City, Country QID]`.
   - `founder (P112)`: `[Founder Name QID or string]`.

### Step 4: Deploy Comprehensive Entity Schema Markup
Embed an advanced `Organization` block on your homepage and `/about` page:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Corporation",
  "@id": "https://example.com/#organization",
  "name": "DevCenterPoint",
  "legalName": "DevCenterPoint Technologies Inc.",
  "url": "https://example.com",
  "logo": "https://example.com/assets/logo.png",
  "foundingDate": "2021",
  "founders": [
    {
      "@type": "Person",
      "name": "Alex Mercer",
      "sameAs": "https://www.linkedin.com/in/alex-mercer"
    }
  ],
  "sameAs": [
    "https://www.wikidata.org/wiki/Q12345678",
    "https://www.crunchbase.com/organization/devcenterpoint",
    "https://www.linkedin.com/company/devcenterpoint",
    "https://twitter.com/devcenterpoint",
    "https://github.com/devcenterpoint"
  ]
}
</script>
```

### Step 5: Claim the Google Knowledge Panel
1. Execute a branded Google search for your company name.
2. When the Knowledge Panel appears on the right sidebar, click **"Claim this knowledge panel"** at the bottom.
3. Authenticate ownership through Google Search Console, your official Twitter/X account, or corporate YouTube channel.
4. Once verified, suggest factual edits directly through the Knowledge Panel management interface if outdated data appears.

## H. Analysis and Decision Framework
Use this framework to evaluate entity actions:

```
                  [Brand Entity Optimization Audit]
                                  |
              Does Google recognize entity in KG Search API?
                            /            \
                         [Yes]           [No]
                          /                \
            Are attributes (CEO, HQ)      Does brand have profiles on
             accurate and up-to-date?     Crunchbase, LinkedIn, Wikidata?
                    /          \                 /          \
                 [Yes]         [No]           [Yes]         [No]
                  /              \             /              \
        (OPTIMAL: Maintain (Claim Knowledge (Deploy sameAs  (Build verified
         schema citations)  Panel & submit   schema linking  external profiles
                            verified edits)  all profiles)   first)
```

## I. Prioritization Framework
Score entity optimization interventions using the **Entity Health Score (EHS)**:

$$\text{EHS} = (\text{KG API Recognized: 40}) + (\text{Wikidata QID: 25}) + (\text{Crunchbase Match: 15}) + (\text{sameAs Schema: 20})$$

Target any domain scoring $< 60$ for an immediate entity infrastructure sprint.

## J. Deliverables & Specifications
Deliver an **Entity Architecture & Knowledge Graph Dossier**:
1. `entity_canonical_name`: Legal brand string.
2. `google_kg_id`: Knowledge Graph machine ID (`kg:/m/...`).
3. `wikidata_qid`: Canonical Wikidata URI (`https://www.wikidata.org/wiki/Q...`).
4. `sameas_identity_array`: Complete list of verified external profile URLs.
5. `validated_json_ld_schema`: Full `Corporation` schema block.
6. `knowledge_panel_status`: Claimed, Unclaimed, or Not Yet Triggered.

## K. Quality Assurance Checklist
- [ ] Brand name, address, and founding date match 100% across all external profiles.
- [ ] Wikidata claims cite independent, non-promotional news sources (no self-referencing blog links).
- [ ] Schema.org JSON-LD validates with 0 errors in Google Rich Results Test.
- [ ] Knowledge Panel claimed using verified Google Search Console owner account.
- [ ] Checked that no defunct or acquired subsidiary names conflict with current entity branding.

## L. Failure Modes and Anti-Patterns
- **The Promotional Wikidata Violation**: Writing marketing puffery on Wikidata (`"DevCenterPoint is the premier, industry-leading provider of world-class tools"`). Wikidata editors will delete the page within hours and protect it against recreation.
- **Entity Inconsistency**: Having two different addresses or company names listed on LinkedIn vs Crunchbase vs Homepage, fracturing the algorithm’s confidence score.
- **Ignoring Executive Entities**: Failing to build authority profiles for the founders and CEO, weakening the company's E-E-A-T signals.

## M. AI-Agent Operating Instructions
1. An AI agent must query the official Google Knowledge Graph API and Wikidata API to verify live entity existence before making assumptions.
2. Ensure generated Schema JSON-LD blocks use valid `@id` graph references and absolute HTTPS URLs.
3. Reject any suggested external profile that does not carry independent editorial verification.

## N. Success Metrics & Verification Windows
- **Knowledge Graph Recognition**: Entity generates a verified `@id` and result score $> 100$ in the Google Knowledge Graph API within 60 days.
- **Knowledge Panel Display**: Branded Google desktop search displays an official Knowledge Panel with verified social links within 90 days.

## O. Related Skills
- **On-Page Implementation**: [Schema Markup](../../On-page%20SEO/Schema%20Markup/SKILL.md), [Entity Coverage](../../Content%20Optimization/Entity%20Coverage/SKILL.md)
- **AI Search Monitoring**: [AI Search Visibility](../AI%20Search%20Visibility/SKILL.md), [AI Citations](../AI%20Citations/SKILL.md)
- **Media Amplification**: [Digital PR](../../Link%20Building/Digital%20PR/SKILL.md)

## P. Authoritative References
- [Google Knowledge Graph Search API](https://developers.google.com/knowledge-graph) — Official API documentation and entity search parameters.
- [Wikidata Notability Guidelines](https://www.wikidata.org/wiki/Wikidata:Notability) — Rules governing acceptable entity inclusion on Wikidata.org.
- [Schema.org Corporation Specification](https://schema.org/Corporation) — Formal vocabulary properties for corporate entities.

## Q. Maintenance and Review Cycle
- **Quarterly Entity Audit**: Verify that executive changes, funding rounds, or office relocations are synchronized across Wikidata, Crunchbase, and Schema.org markup within 30 days of occurrence.
