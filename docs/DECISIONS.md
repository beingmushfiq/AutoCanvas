# AutoCanvas — Architectural Decision Records (ADRs)
**Format:** Michael Nygard template (Status, Context, Decision, Consequences)

---

## ADR-001: Monolith vs. Microservices Architecture
- **Status:** Accepted (2026-11-10)
- **Context:** Building an autonomous brand operations SaaS with solo founder + AI agent development model.
- **Decision:** Build as a single **Modular Monolith** in Laravel 11 with an isolated Chromium rendering daemon.
- **Consequences:** Eliminates premature network hops, distributed transaction complexity, and multi-service deployment debt while keeping clear module encapsulation.

---

## ADR-002: Deterministic SVG/HTML Creative Rendering vs. Generative Image Models
- **Status:** Accepted (2026-11-10)
- **Context:** Commercial brands require exact typography, unaltered vector logos, specific brand color codes, and crisp product imagery. Current diffusion/generative models hallucinate text and distort logos.
- **Decision:** Creative layouts are generated as deterministic HTML/SVG documents; Playwright/Chromium renders pixel-perfect high-resolution PNG/JPEGs. AI is used solely for copy, layout strategy, and background photography generation.
- **Consequences:** Guarantees 100% brand guideline compliance and legibility. Requires dedicated Node.js/Chromium rendering worker.

---

## ADR-003: Identifier Strategy — ULID vs. Auto-Incrementing IDs
- **Status:** Accepted (2026-11-10)
- **Context:** Exposing sequential auto-incrementing integer IDs in APIs allows competitors and scrapers to enumerate records and estimate growth metrics. Standard UUIDv4 has random distribution causing B-tree page fragmentation.
- **Decision:** Use 26-character **ULIDs (Universally Unique Lexicographically Sortable Identifiers)** for all primary keys across all domain tables.
- **Consequences:** Chronologically sortable, indexed efficiently by MySQL B-trees, globally unique, safe for public API exposure.

---

## ADR-004: Multi-Tenant Data Isolation Strategy
- **Status:** Accepted (2026-11-10)
- **Context:** Need strict tenant data boundary guarantees without the operational complexity and cost of spinning up separate databases per tenant.
- **Decision:** Adopt shared-database, shared-schema with explicit `organization_id` foreign keys on every tenant-owned table, enforced at runtime by an Eloquent Global Scope (`HasTenantScope`).
- **Consequences:** Simplifies schema migrations and cross-tenant platform analytics while maintaining strict data isolation verified by automated unit tests.

