# AutoCanvas — Structured Data & Schema.org Knowledge Graph Architecture

> **Document Version:** 1.0.0  
> **Target Standard:** Schema.org Core Vocabulary v26.0+ (JSON-LD Format)  
> **Validation Tools:** Google Rich Results Test & Schema Markup Validator (W3C)

---

## 1. Structured Data Philosophy

AutoCanvas implements semantic structured data using JSON-LD (`application/ld+json`) to establish a disambiguated entity presence in the Google Knowledge Graph and AI training corpora.

### Core Rules
1. **Zero Fabricated Ratings or Reviews:** AutoCanvas strictly rejects fake `AggregateRating` or artificial review schemas. Only authentic, verifiable product attributes are declared.
2. **Entity Disambiguation via Wikidata:** Link abstract software concepts to authoritative Wikidata references using `sameAs` or `about` arrays.
3. **Graph Interconnection:** Combine entities (`Organization`, `SoftwareApplication`, `WebSite`) into a unified `@graph` container so search engines understand the direct relationships between the software, publisher, and domain.

---

## 2. Global Graph Model (`@graph`)

Injected into the root `<head>` on marketing views:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://autocanvas.devcenterpoint.com/#organization",
      "name": "AutoCanvas",
      "url": "https://autocanvas.devcenterpoint.com",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://autocanvas.devcenterpoint.com/#logo",
        "url": "https://autocanvas.devcenterpoint.com/brand/logo.svg",
        "caption": "AutoCanvas Social Media Platform Logo"
      },
      "parentOrganization": {
        "@type": "Organization",
        "name": "DevCenterPoint",
        "url": "https://devcenterpoint.com"
      },
      "sameAs": [
        "https://www.linkedin.com/company/devcenterpoint",
        "https://twitter.com/devcenterpoint"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "hello@devcenterpoint.com"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://autocanvas.devcenterpoint.com/#website",
      "url": "https://autocanvas.devcenterpoint.com",
      "name": "AutoCanvas — Autonomous Social Media Management",
      "publisher": {
        "@id": "https://autocanvas.devcenterpoint.com/#organization"
      },
      "inLanguage": "en-US"
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://autocanvas.devcenterpoint.com/#software",
      "name": "AutoCanvas",
      "operatingSystem": "All (Web-based Cloud SaaS)",
      "applicationCategory": "BusinessApplication",
      "applicationSubCategory": "Social Media Management & Publishing Software",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": "29",
        "highPrice": "199",
        "offerCount": "3"
      },
      "description": "Enterprise-grade multi-tenant social media management platform featuring deterministic AI creative generation, multi-brand workspace isolation, and idempotent cross-platform publishing.",
      "softwareRequirements": "Modern Web Browser (Chrome, Firefox, Safari, Edge)",
      "publisher": {
        "@id": "https://autocanvas.devcenterpoint.com/#organization"
      },
      "featureList": [
        "Multi-Tenant Agency & Brand Workspaces",
        "Deterministic Chromium-Composited AI Creative Studio",
        "Multi-Network Scheduled Publishing (Facebook, Instagram, LinkedIn)",
        "Granular Client Approval Workflows & Public Review Links",
        "Unified Social Media Inbox & Engagement Hub",
        "Cross-Platform Engagement Analytics"
      ]
    }
  ]
}
```

---

## 3. Answer Engine FAQPage Schema

Paired with the accessible FAQ accordion component on the marketing landing page, this structure enables Google Rich Result FAQ badges and direct answer synthesis in conversational search engines:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does AutoCanvas differ from traditional social scheduling tools?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Unlike standard scheduling tools that only queue text and images, AutoCanvas incorporates an integrated deterministic creative studio that renders pixel-perfect visual assets following strict brand guidelines, paired with multi-tenant agency approval workflows and idempotent publishing."
      }
    },
    {
      "@type": "Question",
      "name": "Can AutoCanvas manage multiple clients without risking cross-posting mistakes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. AutoCanvas utilizes multi-tenant architecture where each client operates within a strictly isolated workspace with dedicated brand kits, media libraries, social platform tokens, and permission-based user access."
      }
    },
    {
      "@type": "Question",
      "name": "Which social networks does AutoCanvas currently support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AutoCanvas natively supports Facebook Pages, Instagram Professional (Business & Creator) accounts, and LinkedIn Company Pages via official platform APIs, with planned support for TikTok, X, and YouTube."
      }
    },
    {
      "@type": "Question",
      "name": "What is deterministic creative rendering?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Deterministic rendering uses AI models solely to generate structured copy and layout directives, which a headless Chromium renderer then compiles into pixel-perfect SVG and HTML graphics, ensuring exact typography, brand colors, and logo reproduction without AI image distortion."
      }
    }
  ]
}
```

---

## 4. BreadcrumbList Schema

Implemented for sub-pages (e.g. `/features/creative-studio`, `/pricing`, `/docs`):

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://autocanvas.devcenterpoint.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Features",
      "item": "https://autocanvas.devcenterpoint.com/features"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Creative Studio",
      "item": "https://autocanvas.devcenterpoint.com/features/creative-studio"
    }
  ]
}
```

---

## 5. Verification Checklist
- Run Google Rich Results Test (`https://search.google.com/test/rich-results`) on production URL.
- Verify zero syntax errors, missing field warnings, or unresolved `@id` cross-references in the Schema.org Validator.
- Verify schema blocks render within `<script type="application/ld+json">` without HTML tag escaping anomalies.

