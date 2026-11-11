# AutoCanvas — Design Decision Records (ADRs)

> This document records all foundational architectural, visual, and interaction design decisions governing the AutoCanvas frontend experience.

---

## ADR-001: Visual Direction Selection — "Studio / Editorial Kinetic"
- **Status:** Approved (2026-11-10)
- **Context:** Evaluated three distinct visual directions:
  - Direction A ("Meridian" - Steel Blue / Cartographic)
  - Direction B ("Studio" - Editorial Kinetic / Near-black + Amber Accent)
  - Direction C ("Compose" - Connected Channels / Violet + Teal)
- **Decision:** Selected **Direction B ("Studio / Editorial Kinetic")**. Structural primary is near-black (`var(--brand-primary)`), supported by neutral slates, with an editorial Amber accent (`oklch(68% 0.18 60)`) used strictly for active indicators, focus rings, and intentional focal points.
- **Consequences:** Provides unmistakable market differentiation against competitor tools (Buffer, Hootsuite, Later, Sprout Social), establishes high editorial credibility, and facilitates effortless WCAG 2.2 AA contrast compliance.

---

## ADR-002: Abandoning Tailwind `dark:` in Favor of `[data-theme]` CSS Tokens
- **Status:** Approved (2026-11-10)
- **Context:** Previously, the frontend mixed Tailwind's `dark:` modifier with DOM `data-theme` attribute manipulation, creating unpredictable visual desynchronization and requiring duplicate color utility classes on every element.
- **Decision:** Eliminate all `dark:` class modifiers in JSX. All theming is declared strictly via CSS custom properties scoped to `:root` (light) and `[data-theme='dark']` (dark).
- **Consequences:** Components are clean, token-driven, and automatically theme-aware. Swapping themes updates tokens at the root instantly without component re-renders or layout shifts.

---

## ADR-003: Headless Component Primitive Architecture (Radix UI + Token Wrappers)
- **Status:** Approved (2026-11-11)
- **Context:** Building complex accessible dialogs, tooltips, dropdowns, and tabs from scratch introduces keyboard navigation regressions, broken focus traps, and screen-reader accessibility gaps.
- **Decision:** Standardize on **Radix UI** headless primitives wrapped in our custom token styles following the shadcn/ui architectural pattern. All components reside directly in `frontend/src/components/ui/` as first-class project source code.
- **Consequences:** Guarantees full WCAG 2.2 AA keyboard accessibility, screen-reader compatibility, and complete visual ownership without vendor lock-in.

---

## ADR-004: Dual-Density Responsive Layout Architecture
- **Status:** Approved (2026-11-11)
- **Context:** Small business owners need spacious, relaxed touch targets and comfortable reading typography, whereas marketing agency operators and social media managers require dense, compact data grids to oversee dozens of brands.
- **Decision:** Implement runtime density switching via `document.documentElement[data-density='comfortable'|'compact']`. Card padding, table row heights, navigation gaps, and base font sizes scale dynamically through `--density-*` CSS tokens.
- **Consequences:** A single component codebase serves both enterprise power users and casual business owners without screen duplication.

---

## ADR-005: Progressive Complexity & Adaptive User Experience
- **Status:** Approved (2026-11-11)
- **Context:** Exposing raw cron daemons, multi-workspace governance, compliance audits, and advanced social connectors overwhelms single-brand business owners, while hiding them limits agency teams.
- **Decision:** Drive navigation and detail levels via a persistent `persona` context (`business_owner` vs `agency_pro`). In Business Owner mode, secondary diagnostic and administration tabs are collapsed; in Agency Pro mode, the complete suite is unlocked.
- **Consequences:** Reduces onboarding drop-off while preserving enterprise depth for power users.

---

## ADR-006: Deterministic Creative Canvas Document Model & Social Presets
- **Status:** Approved (2026-11-11)
- **Context:** Social graphics generated solely by raster diffusion models hallucinate typography, blur vector logos, and cannot be audited or modified by assistive technologies.
- **Decision:** The creative canvas uses a versioned, framework-independent JSON scene graph (`CanvasLayerConfig`). Elements are rendered interactively in React Konva and mirrored to an accessible DOM layer tree. When exported or scheduled, the exact JSON payload is sent to the Node.js/Playwright renderer for pixel-perfect compositing. Default canvas presets are locked to:
  - Instagram Square: `1080 × 1080`
  - Landscape Banner: `1200 × 628`
  - Story / Reel: `1080 × 1920`
- **Consequences:** Preserves 100% brand vector integrity, enables non-drag keyboard editing, and ensures deterministic cross-platform social exports.

---

## ADR-007: Purposeful Motion Language & Mandatory Reduced-Motion Overrides
- **Status:** Approved (2026-11-11)
- **Context:** Indiscriminate animation causes cognitive distraction and vestibular motion sickness for sensitive users.
- **Decision:** Motion is strictly functional (communicating spatial context, modal elevation, or active status) and calibrated to 100ms–240ms duration scales. A global `@media (prefers-reduced-motion: reduce)` rule instantly collapses all animation and transition times to 0.01ms.
- **Consequences:** Passes WCAG 2.2 criterion 2.3.3 and ensures a calm, professional studio ambiance.
