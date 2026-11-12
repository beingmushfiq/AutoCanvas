---
name: seo-schema-markup
description: Semantic JSON-LD structured data architecture, Schema.org vocabulary modeling, Rich Result eligibility, and entity disambiguation.
metadata:
  category: On-page SEO
  discipline: Structural Optimization
  version: "1.0.0"
---

# Schema Markup

## A. Purpose
The Schema Markup skill establishes the technical engineering standard for deploying structured data using the Schema.org vocabulary in JSON-LD format. Search engines rely on structured data to disambiguate real-world entities, understand semantic relationships, and populate Rich Results in the search engine results pages (e.g., Star Ratings, FAQ accordions, Product specifications, Breadcrumbs, and Organization Knowledge Panels). Structured data does not guarantee a ranking increase, but it dramatically enhances SERP real estate, snippet CTR, and machine readability for LLM answer engines.

## B. Trigger Conditions
Invoke this skill when:
1. Publishing or updating articles, blog posts, whitepapers, or documentation (`Article`, `TechArticle`).
2. Creating or updating corporate identity, contact pages, or about pages (`Organization`, `Corporation`).
3. Deploying commercial SaaS pricing, physical eCommerce, or software products (`SoftwareApplication`, `Product`, `Offer`).
4. Structuring navigational taxonomies and site hierarchies (`BreadcrumbList`).
5. Fixing Google Search Console "Enhancements" warnings, critical syntax errors, or deprecation notices.

Upstream dependencies: [URL Optimization](../URL%20Optimization/SKILL.md) and [Entity Coverage](../../Content%20Optimization/Entity%20Coverage/SKILL.md).

## C. Scope and Boundaries
- **In-Scope**:
  - Schema.org vocabulary modeling and nesting.
  - JSON-LD script generation in the HTML `<head>` or bottom of `<body>`.
  - Rich Result qualification (Articles, Products, Software, Breadcrumbs, FAQs, Organizations).
  - Entity disambiguation using `sameAs` links to Wikidata, Wikipedia, and official registers.
  - Validation via Google Rich Results Test and Schema.org Validator.
- **Out-of-Scope**:
  - OpenGraph / Twitter Cards (Social meta tags).
  - Microdata and RDFa syntax (JSON-LD is the universally preferred standard; avoid inline microdata).
  - Drafting page content (Handled by [Content Optimization](../../Content%20Optimization/Gap%20Analysis/SKILL.md)).

## D. Required Inputs
1. **Target URL**: The absolute URL where markup will be embedded.
2. **Page Content Type**: Article, Software, Organization, Service, or Product.
3. **Core Entity Attributes**: Author name/URL, Publisher name/logo, Publish date, Modified date, Price, Currency, Rating, Breadcrumb path.
4. **Wikidata / Wikipedia Entity IDs (for entity disambiguation)**: Unique URIs representing recognized entities.

## E. Required Tools and Data Sources
- **Commercial Tooling**: Screaming Frog SEO Spider (Structured Data tab: extraction and validation), Merkle Schema Markup Generator.
- **Zero-Cost / Open Source Alternatives**:
  - Google Rich Results Test (API and web interface).
  - Schema.org Official Validator (`validator.schema.org`).
  - Google Search Console (Enhancements reports).
  - Python scripts validating JSON-LD syntax against official JSON schemas (`jsonschema` library).

## F. Core Concepts and Decision Principles
1. **Format Hegemony: JSON-LD Only**:
   - Google explicitly recommends **JSON-LD** (`<script type="application/ld+json">`) over Microdata and RDFa. JSON-LD decouples structured metadata from display HTML, preventing layout breaks when styling changes.
2. **The "Visible to the User" Rule (Anti-Spam Directive)**:
   - Google's spam guidelines require that all data declared in Schema markup **MUST be visible to the human visitor** on the page. Declaring fake reviews, invisible FAQ questions, or hidden price discounts in JSON-LD that do not appear in the rendered DOM triggers manual spam penalties and structured data revocation.
3. **Entity Disambiguation via `sameAs`**:
   - To tell Google unequivocally which entity you are referencing, use the `sameAs` property linking directly to authoritative entity knowledge graphs (Wikidata, Wikipedia, Crunchbase):
     ```json
     "sameAs": [
       "https://www.wikidata.org/wiki/Q12345",
       "https://en.wikipedia.org/wiki/Entity_Name"
     ]
     ```

## G. Operational Workflow

```
[Identify Document Archetype] -> [Assemble Mandatory Schema Properties]
                 |                                      |
                 v                                      v
    [Inject Entity sameAs Links] -> [Format Clean JSON-LD Script]
                 |                                      |
                 v                                      v
     [Validate via Rich Results API] -> [Deploy to Production <head>]
```

### Step 1: Select the Primary Schema Types
Map page archetypes to their primary Schema.org classes:
- **Corporate Homepage**: `Organization` or `Corporation` + `WebSite` (with `SearchAction`).
- **Editorial / Blog Post**: `Article` or `BlogPosting` or `TechArticle` + `BreadcrumbList`.
- **SaaS Pricing / Product Page**: `SoftwareApplication` or `Product` + `Offer` + `AggregateRating`.
- **Knowledge Base / Technical Guide**: `TechArticle` or `HowTo` (where eligible) + `FAQPage` (for legitimate customer support).

### Step 2: Engineer the Global Organization & WebSite Block (Homepage Only)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "DevCenterPoint",
      "url": "https://example.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://example.com/assets/logo.png",
        "width": 600,
        "height": 60
      },
      "sameAs": [
        "https://www.linkedin.com/company/example",
        "https://twitter.com/example",
        "https://www.wikidata.org/wiki/Q123456"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com",
      "name": "DevCenterPoint",
      "publisher": { "@id": "https://example.com/#organization" }
    }
  ]
}
</script>
```

### Step 3: Engineer Article & BreadcrumbList Schema (Editorial Pages)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://example.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Database Guides",
          "item": "https://example.com/resources/database-guides/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "PostgreSQL Backup Guide",
          "item": "https://example.com/resources/database-guides/postgresql-backup/"
        }
      ]
    },
    {
      "@type": "TechArticle",
      "@id": "https://example.com/resources/database-guides/postgresql-backup/#article",
      "isPartOf": { "@id": "https://example.com/#website" },
      "headline": "PostgreSQL Backup Guide: Automated WAL Archiving & Point-in-Time Recovery",
      "description": "Comprehensive engineering guide to setting up automated write-ahead log replication, continuous archiving, and disaster recovery in PostgreSQL.",
      "inLanguage": "en-US",
      "datePublished": "2026-10-29T00:00:00+00:00",
      "dateModified": "2026-10-29T02:00:00+00:00",
      "author": {
        "@type": "Person",
        "name": "Alex Mercer",
        "jobTitle": "Principal Database Architect",
        "url": "https://example.com/authors/alex-mercer/"
      },
      "publisher": { "@id": "https://example.com/#organization" },
      "image": {
        "@type": "ImageObject",
        "url": "https://example.com/assets/images/postgres-backup-hero.webp",
        "width": 1200,
        "height": 675
      },
      "about": [
        {
          "@type": "Thing",
          "name": "PostgreSQL",
          "sameAs": "https://www.wikidata.org/wiki/Q192490"
        }
      ]
    }
  ]
}
</script>
```

### Step 4: Engineer SaaS SoftwareApplication & Offer Schema
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "DBAEngine Pulse",
  "operatingSystem": "Linux, Cloud, Kubernetes",
  "applicationCategory": "DeveloperApplication",
  "offers": {
    "@type": "Offer",
    "price": "49.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "142",
    "bestRating": "5",
    "worstRating": "1"
  }
}
</script>
```

### Step 5: Programmatic Validation & Testing
1. Run the markup through the official Google Rich Results Test API or web interface:
   - Verify zero **Errors** (missing mandatory fields invalidate Rich Result eligibility).
   - Address **Warnings** where practical (optional fields that improve data richness).
2. Validate graph integrity: Ensure that `@id` cross-references resolve cleanly without circular dependencies.

## H. Analysis and Decision Framework
Use this framework to select and qualify schema deployment:

```
                      [Target Page URL]
                              |
                What is the primary document intent?
                 /            |             \
      [Editorial Guide]   [SaaS Pricing]   [Homepage/About]
             |                |                    |
       TechArticle +     SoftwareApp +       Organization +
      BreadcrumbList        Offer             WebSite block
             |                |                    |
             \----------------+--------------------/
                              |
               Are all declared fields visible
                   to human site visitors?
                         /         \
                      [Yes]        [No]
                       /             \
                  (Deploy)      (REJECT: Risk of manual
                                 structured data penalty)
```

## I. Prioritization Framework
When retrofitting structured data across an existing website:

$$\text{Schema Priority} = \text{Monthly Page Impressions} \times (\text{Product/Offer: 3} + \text{Article: 2} + \text{Breadcrumb: 1})$$

Deploy Breadcrumbs sitewide via CMS templates first, followed by commercial product pages, then high-traffic editorial articles.

## J. Deliverables & Specifications
Deliver a **Structured Data Implementation Script**:
1. `url`: Target document path.
2. `schema_types`: Declared Schema.org classes (`TechArticle`, `BreadcrumbList`, etc.).
3. `json_ld_payload`: Minified, valid JSON-LD script block.
4. `rich_results_eligibility`: Detected eligible features (e.g., Breadcrumb, Article, Review Snippet).
5. `validation_status`: Pass (0 errors, 0 warnings).

## K. Quality Assurance Checklist
- [ ] Valid JSON syntax (no trailing commas, properly escaped quotes).
- [ ] Dates formatted strictly in ISO 8601 (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`).
- [ ] All declared images are accessible and resolve with HTTP 200 OK.
- [ ] Aggregate review ratings reflect genuine customer reviews visible on the live page.
- [ ] Prices and currency codes adhere to ISO 4217 standard (`USD`, `EUR`, `GBP`).
- [ ] Verified via Google Rich Results Test without critical errors.

## L. Failure Modes and Anti-Patterns
- **The Fake Review Penalty**: Adding hard-coded 5.0-star AggregateRating schema to a blog post or service page without real, auditable user reviews. Google actively issues manual spam actions for this.
- **The Deprecated FAQ Trap**: Spamming FAQPage schema on commercial product pages. In August 2023, Google restricted FAQ rich results exclusively to well-known government and health authority websites; generic commercial sites no longer receive FAQ SERP accordions.
- **Microdata and JSON-LD Conflicts**: Injecting modern JSON-LD while leaving old, broken Microdata tags in the HTML template, causing search engines to parse conflicting values.

## M. AI-Agent Operating Instructions
1. An AI agent must parse and validate the JSON string using a strict JSON parser before outputting HTML blocks.
2. Extract the actual author bio, publication timestamp, and visible prices from the page text to ensure 100% parity between markup and visible DOM.
3. Use the `@graph` array pattern when combining multiple interconnected types on a single URL.

## N. Success Metrics & Verification Windows
- **Enhancement Registration**: Google Search Console detects and reports the enhancement type under the "Enhancements" tab within 14 days of re-crawling.
- **Rich Result Display**: Live search results display visual breadcrumbs, author attribution, or product pricing snippets within 30 days.

## O. Related Skills
- **Upstream Input**: [URL Optimization](../URL%20Optimization/SKILL.md), [Entity Coverage](../../Content%20Optimization/Entity%20Coverage/SKILL.md)
- **AI Engine Optimization**: [AI Citations](../../AI%20SEO/AI%20Citations/SKILL.md), [Entity Optimization](../../AI%20SEO/Entity%20Optimization/SKILL.md)
- **Technical Validation**: [Indexing](../../Technical%20SEO/Indexing/SKILL.md)

## P. Authoritative References
- [Google Search Central: Structured Data General Guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) — Strict rules on content visibility and spam policies.
- [Google Search Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) — Complete directory of all rich result types supported by Google Search.
- [Schema.org Documentation](https://schema.org/) — The official master vocabulary reference.

## Q. Maintenance and Review Cycle
- **Monthly GSC Enhancements Audit**: Check Google Search Console Enhancements tab monthly to catch newly introduced schema warnings or deprecated property requirements.
