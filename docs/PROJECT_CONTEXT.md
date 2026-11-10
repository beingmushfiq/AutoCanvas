# AutoCanvas — Project Context & Living Knowledge Base
**Version:** 1.0.0 | **Status:** Phase 0 Completed | **Updated:** 2026-11-10

> **CRITICAL DIRECTIVE FOR ALL AGENTS AND DEVELOPERS:**  
> Read this document in its entirety before modifying, creating, or testing any code in this repository.  
> Do not bypass the architectural boundaries, tenant isolation rules, or state machines defined here.

---

## 1. Executive Summary

- **Product:** AutoCanvas
- **Category:** Autonomous Brand Communication & Social Media Operations Platform
- **Tagline:** One brand. Every channel. Always in rhythm.
- **Architecture:** Multi-Tenant Modular Monolith with Independent Asynchronous Workers
- **Target Audience:** Businesses, organizations, digital brands, and marketing agencies
- **Initial Social Networks:** Facebook Pages, Instagram Professional, LinkedIn Company Pages
- **Future Expansion:** YouTube, TikTok, X, Pinterest, Threads

---

## 2. Repository Layout

```
D:\AutoCanvas\
├── backend/                  # Laravel 11+ REST API & Queue Workers
│   ├── app/
│   │   ├── Core/             # Shared tenant traits, scopes, base DTOs, events
│   │   ├── Modules/          # 14 isolated domain modules (Auth, Brand, Content, etc.)
│   │   ├── AI/               # Provider-independent AI gateway & model router
│   │   └── Http/             # Middleware, root controllers, API resources
│   ├── config/               # Platform, AI, social, and entitlement configs
│   ├── database/             # Migrations, seeders, factories
│   └── tests/                # Unit, Feature, and Integration test suites
│
├── frontend/                 # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── app/              # Routing, layout shells, global providers
│   │   ├── modules/          # Feature UI modules matching backend domain slices
│   │   ├── components/ui/    # Accessible Radix + Tailwind design system primitives
│   │   └── lib/              # API clients, auth token storage, Zustand stores
│   └── tests/
│
├── renderer/                 # Dedicated Node.js + Playwright Chromium rendering service
│   ├── src/                  # Express daemon, browser pool manager, SVG/HTML composers
│   └── package.json
│
├── docs/                     # Living architectural specifications
│   ├── PROJECT_CONTEXT.md    # ← THIS FILE (Read first)
│   ├── ARCHITECTURE.md       # Detailed technical design & patterns
│   ├── DATABASE_DESIGN.md    # ERDs, schema definitions, indexing rules
│   ├── API_SPECIFICATION.md  # REST contracts, headers, error structures
│   ├── SECURITY.md           # Tenant isolation, token encryption, prompt safety
│   ├── DEVELOPMENT_ROADMAP.md# Phase breakdown and milestone acceptance
│   ├── MODULE_STATUS.md      # Real-time capability matrix for 14 modules
│   ├── INTEGRATION_CAPABILITIES.md # Social platform capability matrix
│   └── DECISIONS.md          # Architectural Decision Records (ADRs)
│
├── infrastructure/           # Docker Compose, Nginx, and Supervisor configs
├── scripts/                  # Development and deployment orchestrator scripts
└── .env.example              # Master configuration template
```

---

## 3. Non-Negotiable Operational Principles

1. **Multi-Tenancy Isolation:** Every tenant-owned database table must include an `organization_id` foreign key and enforce the `HasTenantScope` global Eloquent scope. Cross-tenant leakage is a P0 critical vulnerability.
2. **Deterministic Creative Rendering:** AI models do NOT render typography or logos. AI generates layout directives and copy; the Chromium renderer composites pixel-perfect graphics via SVG/HTML templates.
3. **Zero Fake Integrations:** Never mark a social connection as active or a post as published without real, cryptographically verified tokens and official platform API responses.
4. **Idempotent Publishing:** Every publishing job must carry a unique `idempotency_key` (SHA-256 of content fingerprint + destination + slot) and acquire a distributed Redis lock before dispatch.
5. **Brand Before Content:** Content generation must always resolve through the Brand Intelligence profile, content pillars, and safety boundaries. Never generate generic filler posts.
6. **Provider-Agnostic AI:** All LLM and image generation calls must route through `App\AI\Gateway` with task-specific routing, token cost accounting, and schema validation.
7. **Emergency Circuit Breaker:** Any tenant admin must be able to activate `PAUSE_ALL_AUTOMATIONS` in under 2 clicks, halting future job dispatch without deleting scheduled data.

---

## 4. Current Milestone Status

- **Phase 0:** ✅ Scaffolding, Documentation, Environment Configuration (Completed)
- **Phase 1:** ✅ SaaS Foundation (Auth, Organizations, Workspaces, RBAC, Subscriptions, Audit Logs) (Completed)
- **Phase 2:** ✅ Brand Intelligence Engine (Brand Profiles, Visual Identity, Voice, Knowledge Base RAG, Memory, AI Discovery) (Completed)
- **Phase 3:** ✅ Content Production Engine & Creative Studio (Content Pillars, Multi-Platform Copy, Deterministic Renderer, QA Risk Engine, Approval Workflows) (Completed)
- **Phase 4:** ✅ Research & Trend Discovery Engine (RSS Ingestion, Competitor Observation, Opportunity Detection, Content Bridge) (Completed)
- **Phase 5 (Next Up):** Publishing Engine & Social Connectors (OAuth, Idempotent Worker, Retry/DLQ, Social APIs)

---

## 5. Protected Files & Directories (Do Not Modify Without Explicit Review)

- `backend/app/Core/Concerns/HasTenantScope.php`
- `backend/app/Core/Scopes/TenantScope.php`
- `backend/app/Modules/Publishing/Services/PublishingIdempotencyService.php`
- `backend/app/Modules/Billing/Services/EntitlementService.php`
- `backend/app/AI/Gateway/AIGateway.php`
- `docs/DECISIONS.md`

