---
name: autocanvas-product-design
description: "Core AutoCanvas design system engineering guide. Enforces Editorial Kinetic aesthetic direction, OKLCH token contracts, typography hierarchy, and accessibility standards."
---

# AutoCanvas Product Design Skill

## Identity & Philosophy
- **Name:** AutoCanvas
- **Direction:** "Studio / Editorial Kinetic"
- **Key Tenet:** High typographic precision, quiet slate/charcoal foundations, purposeful amber accents (`oklch(68% 0.18 60)`), zero decorative generic AI tropes.

## Token Contract
- Use CSS Custom Properties defined in `frontend/src/index.css`:
  - Backgrounds: `var(--background)`, `var(--background-subtle)`, `var(--background-sunken)`
  - Surfaces: `var(--surface)`, `var(--surface-raised)`, `var(--surface-overlay)`
  - Foregrounds: `var(--foreground)`, `var(--foreground-secondary)`, `var(--foreground-muted)`, `var(--foreground-subtle)`
  - Borders: `var(--border)`, `var(--border-subtle)`, `var(--border-strong)`
  - Brand: `var(--brand-primary)`, `var(--brand-accent)`, `var(--brand-accent-hover)`
  - Interactive: `var(--interactive-primary)`, `var(--interactive-primary-fg)`, `var(--interactive-secondary)`

## Density System
- Components must respect `[data-density='comfortable']` and `[data-density='compact']`.
- Cards, row paddings, and base font sizes adjust automatically via `--density-*` tokens.

## Typography
- Primary UI: Geist Sans
- Metadata & Telemetry: Geist Mono (tabular numerals)
- Multilingual Bengali: Noto Sans Bengali

