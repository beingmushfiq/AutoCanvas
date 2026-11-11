# AutoCanvas — Master Engineering & Design Constitution

> This document establishes mandatory architectural, design, and implementation rules for all human and AI contributors to the AutoCanvas codebase.

---

## 1. Design System & Frontend Architecture

1. **Zero Hex/Raw Color Literals in JSX/TSX:**
   - All styling must resolve through semantic CSS tokens defined in `frontend/src/index.css`.
   - Never use arbitrary Tailwind classes like `bg-[#6366f1]` or `text-[#0f172a]`.

2. **No Tailwind `dark:` Modifier in Components:**
   - Theming is driven by `document.documentElement[data-theme='light'|'dark']`.
   - Component classes must use semantic token abstractions that adapt automatically to the active theme.

3. **Brand Direction — "Studio / Editorial Kinetic":**
   - Structural primary: Near-black (`var(--brand-primary)`) on light, near-white on dark.
   - Editorial accent: Amber (`var(--brand-accent)`), used purposefully for active status, focus rings, and key indicators. Never as a generic primary button background.

4. **Accessibility (WCAG 2.2 AA):**
   - All interactive controls must support full keyboard navigation and visible focus rings (`var(--focus-ring)`).
   - Motion must strictly honor `prefers-reduced-motion: reduce`.
   - All drag/drop operations must provide keyboard-accessible alternatives.

5. **Data Authenticity:**
   - Do not render fabricated metrics, hardcoded chart series, or fake counters in place of real API data.
   - Unpopulated states must render canonical `EmptyState` or structured `Skeleton` components.

---

## 2. Multi-Tenant Backend & Operational Boundaries

1. **Multi-Tenancy Isolation:**
   - Every tenant-owned database table must include an `organization_id` foreign key and enforce the `HasTenantScope` global Eloquent scope.
   - Cross-tenant data leakage is a P0 critical vulnerability.

2. **Deterministic Creative Rendering:**
   - AI models do NOT render typography or logos directly into raster images.
   - AI generates layout directives and copy; the Chromium renderer composites pixel-perfect graphics via SVG/HTML templates.

3. **Zero Fake Integrations:**
   - Never mark a social connection as active or a post as published without real, cryptographically verified tokens and official platform API responses.

4. **Idempotent Publishing:**
   - Every publishing job must carry a unique `idempotency_key` and acquire a distributed Redis lock before dispatch.

5. **Emergency Circuit Breaker:**
   - Any tenant admin must be able to activate `PAUSE_ALL_AUTOMATIONS` in under 2 clicks, halting future job dispatch without deleting scheduled data.

---

## 3. Governance Reference Links
- Rules: `.agents/rules/`
- Design Documentation: `docs/design/`
- Living Architecture Context: `docs/PROJECT_CONTEXT.md`

