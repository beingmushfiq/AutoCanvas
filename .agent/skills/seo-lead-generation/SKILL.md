---
name: seo-lead-generation
description: B2B organic lead generation, high-converting lead magnet architecture, in-content CTA alignment, and organic pipeline attribution.
metadata:
  category: Growth
  discipline: Commercial Acquisition
  version: "1.0.0"
---

# Lead Generation & Organic Pipeline Acquisition

## A. Purpose
The Lead Generation skill governs the architectural design, conversion mechanics, and qualification funnels required to transform organic search visitors into high-value B2B sales leads, marketing qualified leads (MQLs), and enterprise trial accounts. Generating millions of monthly pageviews delivers zero enterprise value if search traffic bounces without engaging. This skill provides an auditable, data-driven methodology for aligning in-content calls-to-action (CTAs) with specific search intent, designing high-converting non-intrusive lead magnets, reducing form friction, and attributing multi-touch organic lead generation into CRM pipeline.

## B. Trigger Conditions
Invoke this skill when:
1. A website possesses substantial organic traffic ($> 25,000$ monthly sessions) but generates an abysmal lead conversion rate ($< 0.5\%$).
2. Launching high-intent B2B commercial content pillars designed specifically to feed outbound or inbound sales teams.
3. Designing gated technical whitepapers, free interactive utilities, or templates to capture prospective buyer contact data.
4. Auditing why certain high-traffic blog articles fail to generate any product demos or trial signups.

Upstream dependencies: [Organic Traffic](../Organic%20Traffic/SKILL.md) and [Conversion Optimization](../Conversion%20Optimization/SKILL.md).

## C. Scope and Boundaries
- **In-Scope**:
  - Intent-to-Offer matching (mapping TOFU, MOFU, and BOFU search intents to specific lead magnets).
  - High-converting lead magnet archetypes (Interactive calculators, proprietary benchmark data, editable code templates, cheat sheets).
  - In-content CTA engineering: Native contextual banners, inline text links, and exit-intent capture.
  - Form friction reduction (progressive profiling, smart social sign-on, single-column field layouts).
  - Lead qualification criteria (MQL vs. SQL scoring based on search query intent).
- **Out-of-Scope**:
  - Outbound cold email sales sequences (Handled by Sales / SDR teams).
  - Paid ad lead capture forms (LinkedIn Lead Gen Forms).
  - General copywriting readability (Handled by [Readability](../../Content%20Optimization/Readability/SKILL.md)).

## D. Required Inputs
1. **Target Customer Persona**: Job title, technical stack, core KPIs, and primary operational bottlenecks.
2. **Current Organic Traffic by Landing Page**: GA4 sessions and current conversion rates across top 20 traffic assets.
3. **Primary Product / Service Offer**: Free trial, self-hosted demo, architectural consultation, or freemium tier.
4. **CRM & Marketing Automation Stack**: HubSpot, Salesforce, Marketo, Customer.io, or webhook infrastructure.

## E. Required Tools and Data Sources
- **Analytics & Tracking**: Google Analytics 4 (Conversions & Key Events), Google Tag Manager.
- **Conversion Capture Platforms**: Unbounce, HubSpot Forms, ConvertFlow, custom React/HTML forms.
- **Data Enrichment**: Clearbit, Apollo, ZoomInfo API (enriching business email submissions with company size and industry).

## F. Core Concepts and Decision Principles
1. **The Intent-to-Offer Alignment Law**:
   - The primary reason organic blog traffic fails to convert is **Intent Mismatch**:
     - *The Mistake*: A visitor searches `how to write bash script for postgres backup` (Informational Problem-Solving Intent). The page aggressively shows a popup saying `Book a 60-Minute Demo with Our Enterprise Sales Team!`. The visitor closes the tab immediately.
     - *The Solution*: Match the offer to the reader's current mental state:
       - **Informational (TOFU)**: Offer a free, downloadable `PostgreSQL Backup Automation Bash Script Template [GitHub Link]`.
       - **Commercial Investigation (MOFU)**: Offer a `PostgreSQL Cloud Backup Cost Calculator & Benchmark Comparison`.
       - **Transactional (BOFU)**: Offer a `14-Day Full Sandbox Trial (No Credit Card Required)`.
2. **The "Give Before You Ask" Principle**:
   - Gating basic informational content behind a 10-field form repels technical professionals and developers.
   - Deliver **80% of the value open and ungated** directly in the article body. Gate only the **high-utility, operational execution asset** (e.g. the production-ready Terraform module, the editable financial spreadsheet, or the raw benchmark CSV).
3. **Form Friction Economics**:
   - Every additional form field reduces conversion rate by approximately $7\% - 12\%$.
   - Asking for `Phone Number`, `Company Address`, and `Annual Budget` on a blog resource download destroys lead volume.
   - Use **Progressive Profiling**: Ask only for `Work Email` on the first touchpoint; enrich company size, industry, and revenue automatically using Clearbit/ZoomInfo APIs behind the scenes.

## G. Operational Workflow

```
[Audit Top 20 Organic Landing Pages in GA4] -> [Classify Search Intent (TOFU/MOFU/BOFU)]
                      |                                              |
                      v                                              v
      [Design Custom Intent-Matched Lead Magnet] -> [Embed Inline & Sticky Contextual CTAs]
                      |                                              |
                      v                                              v
      [Deploy Progressive 1-Field Lead Capture] -> [Enrich Lead Data in CRM & Route to Sales]
```

### Step 1: Landing Page Intent & Conversion Audit
1. Pull the top 20 landing pages generating the highest organic sessions from GA4 over the last 90 days.
2. Audit the current Lead Conversion Rate (LCR) for each page:
   $$\text{LCR} = \frac{\text{Leads Generated}}{\text{Organic Landing Page Sessions}} \times 100$$
   - **Benchmark**:
     - BOFU Product / Pricing pages: **3.0% - 7.0%**
     - MOFU Technical Comparison guides: **1.5% - 3.5%**
     - TOFU Informational articles: **0.8% - 1.8%**
3. Identify pages receiving $> 2,000$ monthly sessions with an LCR $< 0.4\%$; these are your primary lead generation fix targets.

### Step 2: Architect the Specific Lead Magnet
Match the underperforming page to an appropriate asset archetype:

| Search Intent | Example Page Topic | Optimal Lead Magnet Offer |
| :--- | :--- | :--- |
| **TOFU (Problem Aware)** | "What is Database WAL Archiving?" | Downloadable `PostgreSQL Configuration Cheat Sheet [PDF]` |
| **MOFU (Solution Aware)** | "Automated PostgreSQL Backup Architecture" | Production-Ready `Terraform & Docker S3 Backup Module [Repo]` |
| **BOFU (Vendor Evaluation)** | "PostgreSQL Backup Software Comparison" | `Interactive Backup Storage ROI & TCO Estimator Tool` |

### Step 3: Implement Contextual In-Content CTA Components
Deploy CTAs across three high-visibility zones within the article:
1. **The Early Inline Hook (Paragraph 3-4)**:
   - A subtle, native text block that introduces the lead asset immediately after the problem is defined:
     ```html
     <div class="cta-inline-box">
       <p><strong>Need to deploy this immediately?</strong> Download our verified <a href="#download-template">PostgreSQL Automated Backup Script Template</a> (supports S3, GCS, and Azure Blob storage).</p>
     </div>
     ```
2. **The Mid-Article Visual Card (Beneath H2.3)**:
   - A distinct, styled card with a clean graphic preview, 3 bulleted benefits, and a 1-field email capture form.
3. **The Bottom Resource Box**:
   - A comprehensive summary block offering the next logical operational step for the reader.

### Step 4: Frictionless 1-Field Lead Form Implementation
Deploy a streamlined HTML form that requests only the work email:
```html
<form action="/api/leads/capture" method="POST" class="lead-gen-form">
  <input type="hidden" name="source_url" value="/resources/postgresql-backup-guide/" />
  <input type="hidden" name="asset_type" value="bash_script_template" />
  
  <label for="lead_email">Enter your work email to receive the script:</label>
  <div class="input-group">
    <input type="email" id="lead_email" name="work_email" placeholder="alex@company.com" required />
    <button type="submit" class="cta-btn">Get Template</button>
  </div>
  <p class="form-disclaimer">Zero spam. Instant download link sent immediately.</p>
</form>
```

### Step 5: Real-Time API Data Enrichment & CRM Routing
When the user submits their email:
1. Process the lead through an automated enrichment API (Clearbit / ZoomInfo / Apollo):
   - Extract: `Company Name`, `Employee Count`, `Estimated Revenue`, `Industry Vertical`, `Country`.
2. Assign **Lead Score** based on Search Intent:
   - TOFU eBook download = **10 points** (Nurture sequence).
   - MOFU Template / Calculator = **35 points** (Warm nurture).
   - BOFU Demo / Sandbox = **75 points** (Immediate SDR outreach).
3. Push the enriched lead record directly into HubSpot / Salesforce.

## H. Analysis and Decision Framework
Use this framework to qualify lead capture offers:

```
                  [Evaluating In-Content Lead Offer]
                                  |
                Does the offer require more than 3 form fields?
                             /          \
                          [Yes]         [No]
                           /              \
             RESTRUCTURE FORM:            Is the offer directly relevant to the
             Strip to Work Email only;    exact problem discussed on the page?
             enrich company data via API.        /          \
                                              [Yes]         [No]
                                               /              \
                                      (Deploy In-Content (REJECT: Generic
                                       CTA Component)     offer will produce
                                                          < 0.2% conversion)
```

## I. Prioritization Framework
Score landing pages for lead generation retrofitting using the **Lead Acceleration Index (LAI)**:

$$\text{LAI} = \text{Monthly Organic Page Sessions} \times \text{Commercial Intent Score (1-5)} \times (0.02 - \text{Current LCR})$$

Prioritize high-traffic commercial pages where increasing conversion to 2% generates $> 25$ incremental qualified leads/month.

## J. Deliverables & Specifications
Deliver an **Organic Lead Generation Optimization Plan**:
1. `target_landing_page`: URL being optimized.
2. `classified_intent`: TOFU, MOFU, or BOFU.
3. `lead_magnet_concept`: Specific asset title and format.
4. `cta_placement_map`: Exact paragraph positions for inline, visual, and bottom CTAs.
5. `form_field_spec`: 1-field email capture with enrichment triggers.
6. `projected_monthly_leads`: Modeled conversion volume.

## K. Quality Assurance Checklist
- [ ] Lead magnet directly solves the problem articulated in the host article.
- [ ] Lead capture form requires $\le 2$ visible input fields (Work Email preferred).
- [ ] Form submission delivers the promised asset immediately (via instant redirect or email link within 60s).
- [ ] No aggressive, screen-blocking full-page popups on mobile (prevents Google intrusive interstitial penalties).
- [ ] Custom GA4 conversion event (`generate_lead`) fires successfully on form completion.

## L. Failure Modes and Anti-Patterns
- **The Intrusive Interstitial Disaster**: Showing an unclosable full-screen modal popup within 2 seconds of a mobile user landing on the page. Google actively devalues pages that violate the Intrusive Interstitial Guidelines.
- **The "Contact Sales" Trap**: Slapping a generic "Contact Us" form on every educational blog post. A user who just searched a basic definition is not ready to talk to a salesperson.
- **Gating Useless PDFs**: Gating a 2-page superficial summary of Wikipedia facts. Users who download it feel deceived, creating negative brand affinity.

## M. AI-Agent Operating Instructions
1. An AI agent must evaluate landing page intent to suggest contextually relevant lead magnets rather than generic company brochures.
2. Enforce 1-field email form specifications across all proposed lead generation templates.
3. Verify that all conversion tracking snippets adhere to standard GA4 `generate_lead` parameter schemas.

## N. Success Metrics & Verification Windows
- **Conversion Rate Lift**: Target landing page LCR improves to $\ge 1.5\% - 3.0\%$ within 30 days of CTA deployment.
- **Pipeline Contribution**: Organic lead generation funnels account for $\ge 30\%$ of total corporate MQL volume within 90 days.

## O. Related Skills
- **Traffic Feeder**: [Organic Traffic](../Organic%20Traffic/SKILL.md)
- **On-Page CRO**: [Conversion Optimization](../Conversion%20Optimization/SKILL.md)
- **Financial Attribution**: [Revenue Growth](../Revenue%20Growth/SKILL.md)

## P. Authoritative References
- [Google Search Central: Avoid Intrusive Interstitials and Dialogs](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials) — Official mobile penalty policies regarding intrusive popups.
- [HubSpot Research: The Anatomy of a High-Converting Lead Generation Funnel](https://www.hubspot.com/) — Empirical data on form length, placement, and conversion rates.

## Q. Maintenance and Review Cycle
- **Monthly Lead Flow Audit**: Review conversion rates by landing page on the 1st of every month to identify decaying CTA conversion rates and test fresh lead magnet hooks.
