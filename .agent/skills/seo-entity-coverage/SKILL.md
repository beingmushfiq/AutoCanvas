---
name: seo-entity-coverage
description: Knowledge Graph entity alignment, Wikidata concept reconciliation, sameAs ontology mapping, and topical authority clustering.
metadata:
  category: Content Optimization
  discipline: Semantic Engineering
  version: "1.0.0"
---

# Entity Coverage

## A. Purpose
The Entity Coverage skill establishes the operational framework for identifying, disambiguating, and mapping real-world entities into digital content architectures. Modern search engines and AI answer engines operate on the "Things, not strings" paradigm: rather than evaluating documents as bags of lexical words, they resolve words to unique nodes within massive semantic knowledge bases (such as the Google Knowledge Graph, Wikidata, and DBpedia). This skill guarantees that web documents explicitly connect to verified entities, maintain ontological consistency across the domain, and establish unbreakable topical authority.

## B. Trigger Conditions
Invoke this skill when:
1. Building or refreshing content on complex technical, scientific, B2B, or legal domains where terminology ambiguity causes search engine confusion.
2. Aligning a website’s brand or product catalog with Google Knowledge Graph recognition.
3. Optimizing for AI answer engines (ChatGPT Search, Perplexity, Gemini) that rely heavily on entity relationship graphs to generate citations.
4. Auditing a domain that struggles to build topical authority despite publishing dozens of articles.

Upstream dependencies: [SERP Analysis](../../Keyword%20Research/SERP%20Analysis/SKILL.md), [Gap Analysis](../Gap%20Analysis/SKILL.md), and [Schema Markup](../../On-page%20SEO/Schema%20Markup/SKILL.md).

## C. Scope and Boundaries
- **In-Scope**:
  - Wikidata QID identification and reconciliation for core industry concepts.
  - Google Knowledge Graph Search API query evaluation and entity verification.
  - Mapping primary, parent, child, and associative entity relationships.
  - Structuring JSON-LD `about` and `mentions` arrays using authoritative `sameAs` URIs.
  - Entity disambiguation in body copy (resolving homonyms and acronyms).
- **Out-of-Scope**:
  - Pure statistical word co-occurrence modeling (Handled by [NLP Optimization](../NLP%20Optimization/SKILL.md)).
  - Backlink outreach and external brand PR (Handled by [Digital PR](../../Link%20Building/Digital%20PR/SKILL.md)).
  - General copywriting readability (Handled by [Readability](../Readability/SKILL.md)).

## D. Required Inputs
1. **Target Document Text or Outline**: The content being engineered.
2. **Primary Domain Subject Matter**: Core industry or niche definition.
3. **Google Knowledge Graph API Key (Optional)** or free access to Wikidata.org.
4. **Competitor URLs with Verified Knowledge Panels**: Reference URLs for entity benchmarking.

## E. Required Tools and Data Sources
- **Commercial Tooling**: InLinks (Entity extractor and Knowledge Graph optimizer), WordLift (Automated entity markup and custom knowledge graph builder).
- **Zero-Cost / Open Source Alternatives**:
  - Wikidata API (`https://www.wikidata.org/w/api.php?action=wbsearchentities`).
  - Google Knowledge Graph Search API (`https://kgsearch.googleapis.com/v1/entities:search`).
  - Python libraries: `requests`, `spacy` with `spacy-dbpedia-spotlight` or `wikidata-client`.
  - Wikipedia search and disambiguation pages.

## F. Core Concepts and Decision Principles
1. **Things, Not Strings**:
   - A *String* is a sequence of characters: `apple`.
   - An *Entity* is a unique, unambiguous concept with defined attributes and relationships:
     - `Q89` = Apple Inc. (Consumer electronics corporation, Cupertino).
     - `Q893` = Apple (Edible fruit produced by Malus domestica tree).
   - If your document mentions `apple`, search algorithms must determine which entity node to associate your URL with in its semantic graph.
2. **The 3 Entity Relationship Layers**:
   - *Primary Entity (`about`)*: The central subject of the document (e.g., `PostgreSQL`, Wikidata Q192490).
   - *Secondary Supporting Entities (`mentions`)*: Critical components or tools discussed in depth (e.g., `Write-Ahead Logging`, `Disk Storage`, `ACID Transactions`).
   - *Parent Category Entity*: The broader ontological genus (e.g., `Relational Database Management System`, Wikidata Q8208).
3. **Entity Disambiguation via Co-Occurrence**:
   - Algorithms disambiguate entities by evaluating the constellation of neighboring entities. If a page mentions `Kafka`, the algorithm looks for `partitions`, `brokers`, `zookeeper`, `producers`, and `consumers` to distinguish Apache Kafka from Franz Kafka (the novelist).

## G. Operational Workflow

```
[Extract Core Document Concepts] -> [Query Wikidata API for Canonical QIDs]
                 |                                      |
                 v                                      v
 [Map Entity Hierarchies (Parent/Child)] -> [Embed Disambiguation Context in Prose]
                 |                                      |
                 v                                      v
  [Generate JSON-LD about/mentions] -> [Verify Knowledge Graph Entity Alignment]
```

### Step 1: Query Wikidata for Canonical Entity QIDs
1. For each core concept in your target document, query Wikidata to identify its unique identifier (QID):
```bash
# Query Wikidata API for canonical QID
curl -s "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=PostgreSQL&language=en&format=json" \
  | jq '.search[0] | {id: .id, label: .label, description: .description, url: .concepturi}'
```
*Output*:
```json
{
  "id": "Q192490",
  "label": "PostgreSQL",
  "description": "free and open-source relational database management system",
  "url": "http://www.wikidata.org/entity/Q192490"
}
```

### Step 2: Build the Document Entity Graph
Construct an Entity Graph table categorizing the document’s components:

| Entity Label | Entity Role | Canonical Wikidata URI | Wikipedia URI |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | Primary (`about`) | `https://www.wikidata.org/wiki/Q192490` | `https://en.wikipedia.org/wiki/PostgreSQL` |
| **Write-Ahead Logging** | Secondary (`mentions`)| `https://www.wikidata.org/wiki/Q1417034` | `https://en.wikipedia.org/wiki/Write-ahead_logging` |
| **Point-in-Time Recovery** | Secondary (`mentions`)| `https://www.wikidata.org/wiki/Q7207914` | `https://en.wikipedia.org/wiki/Point-in-time_recovery` |
| **RDBMS** | Parent Class | `https://www.wikidata.org/wiki/Q8208` | `https://en.wikipedia.org/wiki/Relational_database` |

### Step 3: Embed Disambiguation Statements in Prose
1. In the introductory paragraph (first 100 words), write a formal **Entity Definition Statement** linking the primary entity to its parent class and primary attributes:
   - *Example*: `PostgreSQL is an open-source object-relational database management system (RDBMS) that utilizes Write-Ahead Logging (WAL) to guarantee ACID transaction durability.`
2. Resolve ambiguous acronyms on their first mention (e.g., write `Point-in-Time Recovery (PITR)` before using `PITR` as a standalone token).

### Step 4: Inject Schema.org Entity Bindings
Embed the verified Wikidata entities into the page’s JSON-LD markup using `about` and `mentions`:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "PostgreSQL Backup and Disaster Recovery Guide",
  "about": [
    {
      "@type": "SoftwareApplication",
      "name": "PostgreSQL",
      "sameAs": "https://www.wikidata.org/wiki/Q192490"
    }
  ],
  "mentions": [
    {
      "@type": "Thing",
      "name": "Write-Ahead Logging",
      "sameAs": "https://www.wikidata.org/wiki/Q1417034"
    },
    {
      "@type": "Thing",
      "name": "Point-in-Time Recovery",
      "sameAs": "https://www.wikidata.org/wiki/Q7207914"
    }
  ]
}
</script>
```

### Step 5: Entity Verification via Google Knowledge Graph Search API
If using Google's Cloud API, query the entity to verify that Google recognizes your primary entity and returns an official `@id` (e.g., `kg:/m/060b4`):
```bash
curl -s "https://kgsearch.googleapis.com/v1/entities:search?query=PostgreSQL&key=YOUR_API_KEY&limit=1" \
  | jq '.itemListElement[0].result | {name: .name, score: .resultScore, description: .description}'
```

## H. Analysis and Decision Framework
Use this framework to select entities for inclusion:

```
                    [Discovered Candidate Concept]
                                  |
                   Does concept have a dedicated page on
                        Wikidata or Wikipedia?
                             /          \
                          [Yes]         [No]
                           /              \
            Is it intrinsically related   (Is it a proprietary brand term?
            to the core topic?             If yes, define on /about page;
                 /            \            otherwise, treat as plain text)
              [Yes]           [No]
               /                \
      (Add to Entity Graph &    (Omit from schema;
       link in Schema JSON-LD)   keep in body text only)
```

## I. Prioritization Framework
Score entity implementation using the **Entity Criticality Index (ECI)**:

$$\text{ECI} = \text{Entity Salience} \times \text{Wikidata Inlink Count (Authority)} \times \text{SERP Competitor Usage (0-1)}$$

Prioritize entities that appear in all top 3 competitor documents and possess established Wikidata nodes.

## J. Deliverables & Specifications
Deliver an **Entity Mapping Specification**:
1. `target_url`: Destination document.
2. `primary_about_entity`: Label, Wikidata QID, and Wikipedia link.
3. `secondary_mentions_entities`: List of 4-8 supporting entities with QIDs.
4. `disambiguation_sentence`: Engineered introductory definition sentence.
5. `schema_json_ld_snippet`: Validated JSON-LD `@graph` containing `about` and `mentions`.

## K. Quality Assurance Checklist
- [ ] Every QID verified by navigating to `https://www.wikidata.org/wiki/{QID}`.
- [ ] No mismatched entities (e.g., linking to the movie *Inception* instead of the psychological concept).
- [ ] Primary entity declared under `about`; supporting concepts declared under `mentions`.
- [ ] Acronyms defined explicitly in prose on first usage.
- [ ] JSON-LD parses with zero errors in Google Rich Results Test.

## L. Failure Modes and Anti-Patterns
- **The "Everything is an Entity" Bloat**: Linking 150 generic concepts (e.g. `Time`, `Computer`, `Business`, `Internet`) in schema, creating semantic noise that dilutes document focus.
- **Wikidata Hallucination**: An AI agent guessing a QID (e.g. `Q999999`) without querying the API, creating broken links in structured data.
- **Mismatched Entity Types**: Declaring a software program as `@type: "Person"` in Schema.org markup.

## M. AI-Agent Operating Instructions
1. An AI agent must execute live HTTP requests to the Wikidata API to retrieve exact QIDs; never guess or synthesize entity IDs.
2. Cross-verify entity labels and descriptions against the target article's domain context before embedding.
3. Limit JSON-LD `mentions` arrays to the 5-8 most critical supporting concepts.

## N. Success Metrics & Verification Windows
- **Entity Association**: Page URL is recognized by Google Knowledge Graph algorithms as an authoritative source for the entity within 60 days.
- **AI Citation Inclusion**: Target page is referenced by Perplexity, Gemini, or ChatGPT Search when queried about the core entity relationships within 45 days.

## O. Related Skills
- **Upstream Input**: [Gap Analysis](../Gap%20Analysis/SKILL.md), [SERP Analysis](../../Keyword%20Research/SERP%20Analysis/SKILL.md)
- **Technical Markup**: [Schema Markup](../../On-page%20SEO/Schema%20Markup/SKILL.md)
- **AI Search Optimization**: [AI Citations](../../AI%20SEO/AI%20Citations/SKILL.md), [Entity Optimization](../../AI%20SEO/Entity%20Optimization/SKILL.md)

## P. Authoritative References
- [Singhal, Amit (Google Official Blog): Introducing the Knowledge Graph: Things, Not Strings](https://blog.google/products/search/introducing-knowledge-graph-things-not/) — The foundational paradigm shift from lexical search to entity search.
- [Wikidata: Database Search & API](https://www.wikidata.org/wiki/Wikidata:Data_access) — The open knowledge base powering global semantic entity resolution.
- [Google Search Central: Structured Data - About and Mentions](https://schema.org/about) — Schema.org specification for entity subject modeling.

## Q. Maintenance and Review Cycle
- **Annual Ontology Audit**: Review entity graphs annually to add newly created Wikidata QIDs for emerging technologies, tools, or frameworks.
