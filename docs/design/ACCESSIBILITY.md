# AutoCanvas Accessibility (WCAG 2.2 AA)

## 1. Target Standards
AutoCanvas adheres to WCAG 2.2 Level AA guidelines across all views, modals, creative studios, and navigation systems.

## 2. Key Checkpoints
1. **Focus Management:**
   - Active focus indicator: 2px solid `var(--focus-ring)` with 2px offset.
   - Visible outline on all interactive buttons, inputs, links, and canvas layers.
2. **Keyboard Navigation:**
   - Full keyboard accessibility for the Command Palette (`⌘K` / `Ctrl+K`).
   - Arrow-key navigation inside the sidebar, dropdown menus, and tabs.
   - Direct shortcuts for critical workflows (e.g. `Esc` to close overlays, `?` for keyboard cheat sheet).
3. **Screen Reader Landmarks:**
   - `<header role="banner">`
   - `<aside role="navigation" aria-label="Main Navigation">`
   - `<main role="main">`
   - Real-time announcements for background worker jobs via `role="status"` and `aria-live="polite"`.
4. **Color Independence:**
   - Status indicators (Success, Warning, Danger) combine color tokens with distinct geometric icons (`CheckCircle2`, `AlertOctagon`, `AlertTriangle`).

