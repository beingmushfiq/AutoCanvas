# AutoCanvas — Implementation Roadmap & Execution Ledger
**Document ID:** IMPL-ROADMAP-001  
**Version:** 2.0.0 (Production Master)  
**Execution Methodology:** Phased Atomic Delivery with Definition of Done (DoD) Verification Gates  

---

## 1. Phased Delivery Overview

```mermaid
gantt
    title AutoCanvas Production Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Architectural Alignment
    Phase 0: Audit & Architecture Blueprint         :done, p0, 2026-11-10, 1d
    section Platform Foundation
    Phase 1: Core SaaS Foundation & Custom RBAC     :active, p1, 2026-11-11, 3d
    Phase 2: Master Control Plane Engine            :p2, after p1, 3d
    Phase 3: Subscriptions & Local Billing (bKash)  :p3, after p2, 3d
    section Intelligence & Connectors
    Phase 4: Multi-Model AI Gateway & Brand RAG     :p4, after p3, 4d
    Phase 5: Real Social Integrations (FB/IG/LI)    :p5, after p4, 4d
    section Studio & Automation
    Phase 6: Content Production & Chromium Studio   :p6, after p5, 4d
    Phase 7: Idempotent Publishing & Schedulers     :p7, after p6, 3d
    section Operations & Delivery
    Phase 8: Community Unified Inbox & Analytics    :p8, after p7, 3d
    Phase 9: Complete Public & In-App CMS           :p9, after p8, 3d
    Phase 10: Production Hardening & cPanel Deploy  :p10, after p9, 3d
```

---

## 2. Phase-by-Phase Technical Manifest & Definition of Done

### Phase 0 — Audit and Architecture (COMPLETED)
- **Objective:** Exhaustive codebase inspection, stack verification, and authoring of the complete production architectural blueprint.
- **Deliverables:**
  - `docs/architecture/SYSTEM_ARCHITECTURE.md`
  - `docs/architecture/DATABASE_ARCHITECTURE.md`
  - `docs/architecture/API_ARCHITECTURE.md`
  - `docs/architecture/SECURITY_ARCHITECTURE.md`
  - `docs/architecture/DEPLOYMENT_ARCHITECTURE.md`
  - `docs/architecture/MASTER_CONTROL_PANEL.md`
  - `docs/implementation/IMPLEMENTATION_ROADMAP.md`
  - `docs/implementation/TECHNICAL_DECISIONS.md`
- **Definition of Done:** Zero code mutations; architecture documents reviewed and aligned with prompt specifications.

---

### Phase 1 — Core SaaS Foundation & Custom RBAC
- **Objective:** Harden multi-tenant authentication, implement the custom database-backed RBAC permission registry as the sovereign foundation, and enforce zero cross-tenant leakage.
- **Key Tasks:**
  1. Author migration for `permissions`, `roles`, `role_permissions`, and `user_roles`.
  2. Implement `App\Core\Security\PermissionRegistry` and dynamic Laravel Gates.
  3. Wire `RequirePermission` middleware supporting granular dot-notation abilities.
  4. Ensure `EnsureTenantScope` middleware and `HasTenantScope` trait strictly guard all tenant queries.
  5. Audit logging integration for all security events.
- **Definition of Done:** Automated test suite verifying that cross-tenant access attempts fail with 403, and permission checks successfully permit/block actions based on database registry.

---

### Phase 2 — Master Control Plane Engine
- **Objective:** Build the platform owner administrative engine for multi-tenant governance, system telemetry, and emergency controls.
- **Key Tasks:**
  1. Implement `ControlPlaneAuthController` and `/api/v1/control-plane/*` route group.
  2. Build `PlatformMetricsService` computing real-time ARR, MRR, tenant counts, queue backlogs, and AI token costs.
  3. Implement `TenantManagementController` with suspend, activate, quota override, and scoped read-only impersonation tokens.
  4. Build `SystemSettingsController` with JSON change diff auditing.
  5. Implement `MasterCommandController` for natural-language intent parsing with two-stage confirmation for destructive operations.
  6. Connect emergency circuit breaker endpoints.
- **Definition of Done:** Control Plane APIs pass all feature tests; non-admins receive immediate 403 Forbidden; destructive commands require signed confirmation tokens.

---

### Phase 3 — Subscriptions, Entitlements & Local Billing (bKash & Nagad)
- **Objective:** Replace generic placeholders with a production-grade billing engine supporting local payment rails (bKash, Nagad) alongside manual verification workflows.
- **Key Tasks:**
  1. Author migrations for `invoices` and `payment_transactions`.
  2. Implement `EntitlementService` asserting strict usage boundaries on workspaces, brands, team members, social accounts, and monthly AI tokens.
  3. Implement checkout flow generating unique invoice numbers.
  4. Build payment submission endpoint for tenant TrxID entry (bKash/Nagad).
  5. Build administrative verification queue in Control Plane with approve/reject actions and automated invoice settlement.
  6. Idempotency protection on payment webhook/verification endpoints.
- **Definition of Done:** End-to-end checkout, payment submission, administrative approval, and automatic subscription entitlement renewal verified via automated tests.

---

### Phase 4 — AI Gateway & Brand Intelligence Engine
- **Objective:** Elevate the AI Gateway from mock stubs to a multi-model router supporting Google Gemini 1.5, Anthropic Claude 3.5, and OpenAI GPT-4o, with strict token cost tracking and brand knowledge RAG.
- **Key Tasks:**
  1. Implement `GeminiProvider`, `AnthropicProvider`, and `OpenAIProvider` conforming to `AIProviderInterface`.
  2. Implement dynamic task router in `AIGateway` with automatic failover fallback chains.
  3. Real-time cost calculation and persistence in `ai_usage_records`.
  4. Brand Intelligence Engine: Visual identity tokens, tone descriptors, persona mapping, and brand memory storage.
  5. Knowledge Base ingestion: text chunking, embedding generation, and cosine similarity vector retrieval.
- **Definition of Done:** Real API calls routed correctly based on task type; token spend tracked per tenant; brand knowledge chunks retrieved and injected into prompt context.

---

### Phase 5 — Real Social Platform Integrations (Meta & LinkedIn)
- **Objective:** Replace placeholder social connectors with verified, production-grade OAuth2 and REST client integrations for Facebook Pages, Instagram Professional, and LinkedIn Company Pages.
- **Key Tasks:**
  1. Implement AES-256-GCM encryption on `social_accounts` for access and refresh tokens.
  2. Build official OAuth2 handshake flows with CSRF state verification:
     - Meta Graph API v19+ (Facebook Pages & Instagram Professional accounts).
     - LinkedIn v2 Community Management API (Organization URNs).
  3. Build automated token refresher job checking expiration windows.
  4. Webhook ingestion controllers for real-time status updates and incoming comments.
- **Definition of Done:** Real OAuth URL generation, state validation, encrypted token storage, and mock-verified publishing to Graph API / LinkedIn endpoints.

---

### Phase 6 — Content Strategy, Production & Creative Studio
- **Objective:** Integrate content pillar allocation, multi-platform copy generation, and deterministic Chromium rendering for visual assets.
- **Key Tasks:**
  1. Content Pillars & Campaigns: target distribution calculation and calendar planning.
  2. AI Copy Production: Platform-specific post formatting (character limits, hashtag optimization, CTA structures).
  3. Content QA & Risk Engine: Hallucination, tone deviation, and brand safety scoring before submission.
  4. Multi-stage Approval Workflow: Draft -> Review -> Approved -> Scheduled.
  5. Creative Studio Backend: Store vector canvas documents (`creative_documents`), serialize layers into HTML/SVG, and dispatch rendering payloads to `renderer/` (Playwright Chromium).
- **Definition of Done:** Post drafts generated, evaluated by QA engine, approved via role permissions, and rendered into high-resolution PNG/JPEG graphics without typography distortion.

---

### Phase 7 — Publishing Engine & Idempotent Automation
- **Objective:** Deploy the mission-critical publishing queue with distributed locking, reconciliation before retry, and automated scheduling.
- **Key Tasks:**
  1. Implement `PublishingJob` with 60-second atomic locks (`Redis::lock()` or MySQL `GET_LOCK()`).
  2. Build pre-publish remote status reconciliation to prevent duplicate posts upon worker restart.
  3. Implement exponential backoff retry handler with Dead Letter Queue (DLQ) logging in `publishing_attempts`.
  4. Schedule engine: Wire `php artisan platform:publish-scheduled` to run every minute via Laravel scheduler.
  5. Emergency circuit breaker check integrated into worker loop.
- **Definition of Done:** Simulated network interruption demonstrates that publishing job acquires lock, reconciles remote status, and logs detailed attempts without posting duplicates.

---

### Phase 8 — Community Management, Unified Inbox & Analytics
- **Objective:** Build multi-channel community interaction and consolidated analytics ingestion.
- **Key Tasks:**
  1. Unified Inbox: Aggregate incoming comments and direct messages from connected Facebook, Instagram, and LinkedIn accounts.
  2. AI Sentiment & Reply Suggester: Classify incoming comment sentiment (positive, neutral, negative, question) and generate on-brand suggested replies.
  3. Reply Dispatcher: Post approved replies back through the respective social connector.
  4. Analytics Ingestion: Hourly/daily metric snapshots (impressions, reach, engagement, clicks, follower growth) consolidated into `analytics_metrics`.
- **Definition of Done:** Comments ingested, sentiment classified, AI replies generated, and analytics snapshots plotted accurately against calendar intervals.

---

### Phase 9 — Complete Public & In-App CMS
- **Objective:** Provide a full-featured Content Management System for marketing pages, documentation, changelogs, and in-app announcements.
- **Key Tasks:**
  1. Database migrations for `cms_pages`, `cms_posts`, and `cms_in_app_announcements`.
  2. Public CMS API delivering structured JSON for landing pages, features, pricing, and blog articles.
  3. In-App Banner & Notification Engine: Display targeted announcements, feature releases, or maintenance banners to tenant workspaces.
  4. Control Plane CMS Editor: Manage content, SEO metadata, and publishing schedules.
- **Definition of Done:** Marketing pages editable via Control Plane; published content accessible via public API; in-app banners render conditionally based on user dismissals.

---

### Phase 10 — Production Hardening & Deployment Orchestration
- **Objective:** Finalize deployment automation for cPanel and VPS, conduct comprehensive security audits, and execute full end-to-end test suites.
- **Key Tasks:**
  1. Author cPanel deployment script (`scripts/deploy-cpanel.sh` & `scripts/dev.ps1`).
  2. Build VPS migration blueprint (`scripts/migrate-to-vps.sh`).
  3. Build standalone CLI recovery tool (`app/Console/Commands/Emergency*`).
  4. Execute full PHPUnit test suite (Unit, Feature, Security, Idempotency, RBAC).
  5. Verify zero-hex and WCAG 2.2 AA compliance across all frontend screens.
- **Definition of Done:** 100% test pass rate across all suites; deployment scripts validated; zero security vulnerabilities detected in automated audit.

---
*Signed by Principal Software Architect & Technical Lead*  
*AutoCanvas Platform Engineering Team*

