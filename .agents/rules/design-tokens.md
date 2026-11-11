# Rule: Design Tokens & Semantic Styling

1. **Zero Hex/Raw Color Literals:**
   - NEVER use raw hex color codes (e.g. `#6366f1`, `#0f172a`), arbitrary color utilities (e.g. `bg-[#...]`, `text-[#...]`), or non-semantic Tailwind color palettes directly in UI components.
   - All colors MUST resolve through CSS custom properties defined in `frontend/src/index.css` (e.g. `var(--background)`, `var(--surface)`, `var(--foreground)`, `var(--brand-accent)`).

2. **No Tailwind `dark:` Modifier in Component Files:**
   - AutoCanvas theming is driven by `document.documentElement[data-theme='light'|'dark']`.
   - Never write `dark:bg-...` or `dark:text-...` in component JSX. Styling must automatically adapt via semantic tokens configured for `[data-theme="light"]` and `[data-theme="dark"]`.

3. **Color Roles:**
   - `--brand-primary`: Structural primary (near-black in light mode, near-white in dark mode).
   - `--brand-accent`: Editorial Amber (`oklch(68% 0.18 60)`). Used solely for active indicators, focus rings, and deliberate focal highlights. NEVER as a generic saturated button background.
   - `--interactive-primary`: High-contrast actionable controls.

