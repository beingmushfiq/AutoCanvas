# AutoCanvas — Architectural Decision Records (ADRs)
**Document ID:** IMPL-DECISIONS-001  
**Version:** 2.0.0 (Production Master)  
**Status:** Living Technical Decision Ledger  

---

## Index of Architectural Decision Records

- [ADR-001: Modular Monolith vs Microservices Architecture](#adr-001-modular-monolith-vs-microservices-architecture)
- [ADR-002: Dual-Plane Architecture (Control Plane vs Tenant Application Plane)](#adr-002-dual-plane-architecture-control-plane-vs-tenant-application-plane)
- [ADR-003: Foundation-First Custom RBAC Permission Registry](#adr-003-foundation-first-custom-rbac-permission-registry)
- [ADR-004: cPanel Compatibility with Database/File Fallback for Redis & Workers](#adr-004-cpanel-compatibility-with-databasefile-fallback-for-redis--workers)
- [ADR-005: Local Payment Rails (bKash & Nagad) with Manual Offline Verification Queue](#adr-005-local-payment-rails-bkash--nagad-with-manual-offline-verification-queue)
- [ADR-006: Headless Chromium vs AI Direct Rasterization for Visual Creatives](#adr-006-headless-chromium-vs-ai-direct-rasterization-for-visual-creatives)
- [ADR-007: Provider-Agnostic Multi-Model AI Gateway with Token Cost Accounting](#adr-007-provider-agnostic-multi-model-ai-gateway-with-token-cost-accounting)
- [ADR-008: Standalone CLI Emergency Recovery Tool Independent of Web Application](#adr-008-standalone-cli-emergency-recovery-tool-independent-of-web-application)
- [ADR-009: Deterministic Intent Router for Natural-Language Command Interface](#adr-009-deterministic-intent-router-for-natural-language-command-interface)
- [ADR-010: Cryptographic Envelope Encryption for Social OAuth Credentials](#adr-010-cryptographic-envelope-encryption-for-social-oauth-credentials)

---

### ADR-001: Modular Monolith vs Microservices Architecture
- **Context:** AutoCanvas combines complex domains (AI research, brand memory, creative composition, social connectors, community inbox, billing). A microservices architecture introduces network latency, distributed transactions, deployment complexity, and high cloud infrastructure costs prohibitive for a solo founder.
- **Decision:** Architect the platform as a **Modular Monolith** in Laravel 11/12+ with PHP 8.3. Each domain (Auth, Brand, ContentProduction, SocialConnectors, Publishing, etc.) is isolated in `app/Modules/{Domain}` with dedicated models, services, controllers, and tests.
- **Consequences:**
  - *Positive:* Fast local development, zero inter-service network overhead, simplified single-database transactions, zero-daemon cPanel deployability, trivial shared testing.
  - *Trade-off:* Requires disciplined enforcement of module boundaries; inter-module calls must route through service contracts or events rather than raw database cross-queries.

---

### ADR-002: Dual-Plane Architecture (Control Plane vs Tenant Application Plane)
- **Context:** Administrative functions (system settings, plan configuration, tenant suspension, global AI model routing) must not collide with tenant-level operations or risk accidental privilege escalation.
- **Decision:** Strictly split the system into two distinct operational planes:
  1. **SaaS Control Plane:** Accessible only at `/control-plane` and `/api/v1/control-plane/*` for users with `is_platform_admin = true`. Exempt from `HasTenantScope`.
  2. **Tenant Application Plane:** Accessible at `/api/v1/*` guarded by `EnsureTenantScope` middleware and `HasTenantScope` Eloquent global scopes.
- **Consequences:**
  - *Positive:* Guarantees tenant isolation, eliminates tenant-to-admin data leaks, enables distinct audit logging, and simplifies administrative governance.
  - *Trade-off:* Platform admins must maintain separate administrative credentials or explicitly switch context.

---

### ADR-003: Foundation-First Custom RBAC Permission Registry
- **Context:** Hardcoding roles as static strings (`'admin'`, `'editor'`) causes severe architectural debt when client organizations require custom permissions (e.g., "can approve drafts but cannot publish directly" or "can view analytics but cannot invite members").
- **Decision:** Implement a **database-backed, fine-grained Permission Registry** (`permissions`, `roles`, `role_permissions`, `user_roles`) as the initial platform foundation before building administrative or tenant management screens.
- **Consequences:**
  - *Positive:* Infinite flexibility for custom enterprise roles; programmatic binding to Laravel Gates; zero rework needed when adding new module features.
  - *Trade-off:* Slightly higher initial migration and seeding complexity; requires permission caching to avoid redundant query overhead on every HTTP request.

---

### ADR-004: cPanel Compatibility with Database/File Fallback for Redis & Workers
- **Context:** AutoCanvas must be deployable immediately on cost-effective shared cPanel hosting (LiteSpeed/Apache, MySQL 8.0, PHP 8.3) where Redis daemons and persistent Supervisor worker processes are typically unavailable.
- **Decision:** Design the backend with automatic database-backed fallbacks:
  - Cache & Sessions: `database` store.
  - Queues: `database` driver invoked via cron `php artisan queue:work --stop-when-empty --max-time=50`.
  - Concurrency Locks: MySQL `GET_LOCK()` / `DB::transaction()` fallback for Redis locks.
  - A single `.env` update flips the driver to `redis` when migrating to VPS.
- **Consequences:**
  - *Positive:* Solo founder can run production on a \$5/mo shared cPanel plan without breaking functionality.
  - *Trade-off:* Queue throughput on cPanel is bounded by MySQL I/O and 1-minute cron granularity.

---

### ADR-005: Local Payment Rails (bKash & Nagad) with Manual Offline Verification Queue
- **Context:** Standard Western SaaS templates assume Stripe, which is unavailable or heavily restricted in South Asia (Bangladesh, India, Pakistan). AutoCanvas requires native support for local mobile financial services (bKash, Nagad) and manual bank transfers.
- **Decision:** Implement a dual-mode billing engine:
  1. Direct merchant API integration for automated checkout where API credentials exist.
  2. **Offline Transaction Submission & Verification Queue:** Tenants submit their mobile transaction ID (TrxID) upon checkout; platform administrators verify the transaction in the Control Panel with one-click approval/rejection.
- **Consequences:**
  - *Positive:* Unlocks immediate commercial viability in high-growth emerging markets without Stripe dependency; 100% resilient to API downtime.
  - *Trade-off:* Requires administrative intervention to approve manual transactions during early phases.

---

### ADR-006: Headless Chromium vs AI Direct Rasterization for Visual Creatives
- **Context:** Generative AI image models (DALL-E, Midjourney, Imagen) are incapable of reliably rendering crisp vector typography, exact brand hex colors, aligned layouts, or corporate logos, frequently hallucinating gibberish text.
- **Decision:** Adopt a **Deterministic Rendering Pipeline**. AI generates copy, layout directives, and visual parameters; a dedicated Node.js + Playwright Chromium rendering daemon (`renderer/`) loads HTML5/SVG templates with local fonts and captures pixel-perfect raster assets.
- **Consequences:**
  - *Positive:* 100% brand-compliant typography, zero text hallucinations, sharp vector lines, exact color fidelity, and predictable rendering costs.
  - *Trade-off:* Requires a running Node.js process (or external rendering service) alongside PHP.

---

### ADR-007: Provider-Agnostic Multi-Model AI Gateway with Token Cost Accounting
- **Context:** Hardcoding calls to a single AI vendor (e.g., OpenAI) introduces platform vulnerability to vendor outages, price changes, and rate limit throttling.
- **Decision:** Route all AI calls through `App\AI\Gateway\AIGateway` supporting Google Gemini 1.5, Anthropic Claude 3.5, and OpenAI GPT-4o, with task-specific model routing and automated fallback chains. Every call logs token consumption and calculated USD costs to `ai_usage_records`.
- **Consequences:**
  - *Positive:* Zero vendor lock-in; optimizes cost by routing cheap tasks to Gemini Flash / GPT-4o-mini and complex tasks to Claude Sonnet; transparent billing telemetry.
  - *Trade-off:* Requires maintaining compatibility with multiple vendor SDKs and payload formats.

---

### ADR-008: Standalone CLI Emergency Recovery Tool Independent of Web Application
- **Context:** If a bad code deployment, corrupted database setting, or active attack disables the web application, operators cannot access web-based administrative consoles to fix the issue.
- **Decision:** Build an out-of-band CLI tool (`php artisan emergency:*`) that executes directly through SSH / cPanel terminal to pause all queues, promote admin users, reset credentials, or revoke leaked tokens without web dependencies.
- **Consequences:**
  - *Positive:* Guarantees non-repudiable emergency intervention even during catastrophic frontend or web server failure.
  - *Trade-off:* Requires terminal/SSH access to the hosting server.

---

### ADR-009: Deterministic Intent Router for Natural-Language Command Interface
- **Context:** Providing natural-language command capability in the Master Control Panel poses extreme security risks if LLMs are permitted to generate or execute arbitrary SQL queries or system commands.
- **Decision:** Enforce a **Deterministic Action Intent Engine**. Natural language queries are classified by the AI Gateway into one of 18 strictly pre-defined system actions with typed parameter schemas. Destructive actions require a cryptographically signed two-stage confirmation token.
- **Consequences:**
  - *Positive:* Combines conversational flexibility with military-grade operational safety; zero risk of AI-hallucinated SQL drop commands.
  - *Trade-off:* New administrative capabilities must be explicitly registered in the intent catalog before they can be triggered by voice or natural language.

---

### ADR-010: Cryptographic Envelope Encryption for Social OAuth Credentials
- **Context:** Storing social OAuth access and refresh tokens in plaintext exposes connected customer accounts to total takeover in the event of database dumps or SQL injection vulnerabilities.
- **Decision:** Store all social credentials in `social_accounts` using AES-256-GCM envelope encryption via Laravel's encrypted model attributes. Tokens are decrypted in memory only at the precise instant of API dispatch and are never serialized into API responses or logs.
- **Consequences:**
  - *Positive:* Full compliance with Meta, Google, and LinkedIn security developer policies; guarantees tenant data protection.
  - *Trade-off:* Minor CPU overhead during encryption/decryption cycles; key rotation requires an atomic database re-encryption job.

---
*Signed by Principal Software Architect & Technical Lead*  
*AutoCanvas Platform Engineering Team*

