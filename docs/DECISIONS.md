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

---

## ADR-005: Frontend Design System, UI/UX Toolkit & Permissive Stack Selection
- **Status:** Accepted (2026-11-10)
- **Context:** AutoCanvas requires a memorable, distinctive, high-craft user interface that avoids generic "AI UI" tropes (purple-on-white gradients, default frameworks, unstyled chatbot layouts) while respecting strict commercial licensing constraints and supporting complex multi-channel operational workflows.
- **Decision:**
  1. **Design Intelligence Foundation**: Standardize on `UI/UX Pro Max` (`NEXTLEVELBUILDER`) for systematic, searchable UX guidelines, design tokens, color harmonies, and chart archetypes, combined with `Frontend Design` (Anthropic) for aesthetic discipline, intentional typography, non-generic layouts, and an explicit aesthetic stance: **Industrial Kinetic / Editorial Studio Operations**.
  2. **Permissively Licensed Implementation Stack**:
     - **Component Primitives**: `shadcn/ui` + `Radix UI` accessible headless primitives (Dialog, Tooltip, Dropdown Menu).
     - **Styling & Tokens**: `Tailwind CSS v4` with `@theme` custom properties supporting Obsidian Slate Dark mode and Clean Light mode, plus Comfortable vs. Compact density.
     - **Iconography**: `Lucide React` for consistent, restrained system iconography.
     - **Motion**: `Motion for React` (`motion`) for purposeful entrance and state transitions.
     - **Creative Canvas Editor**: `React Konva` (100% MIT-licensed), explicitly avoiding `tldraw` due to commercial SDK licensing restrictions.
     - **Publishing Calendar**: `FullCalendar` MIT-core (`dayGridMonth`), avoiding proprietary premium scheduler modules.
     - **Data Grids & Tables**: `TanStack Table` for sortable, filterable publishing queues and audit trails.
     - **Telemetry & Visualizations**: `Recharts` for real operational data (publishing cadence, multi-channel reach, worker health).
     - **Global Command Palette**: `cmdk` mounted globally with `⌘K` / `Ctrl+K` keyboard shortcuts.
  3. **Typography Standard**:
     - `Geist Sans`: Primary Latin application typography.
     - `Geist Mono`: Technical metadata, identifiers, and numerical telemetry.
     - `Noto Sans Bengali`: Multilingual Bangla content and script fallback. All fonts licensed under SIL Open Font License.
  4. **Progressive Complexity & Accessibility**:
     - User persona toggle (`Business Owner` vs `Agency Pro`) to prevent UI overwhelm while enabling power users.
     - Full keyboard accessibility (WCAG 2.2 AA compliant focus rings, contrast ratios, and non-drag alternatives).
- **Consequences:** Eliminates third-party commercial license liabilities, delivers an ownable and high-craft brand aesthetic, ensures WCAG 2.2 AA accessibility compliance, and guarantees zero dependency friction across developer environments.


