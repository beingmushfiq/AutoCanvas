# AutoCanvas Component Architecture

## 1. Unified Primitive Foundation
All user interface components derive from a single unified design system wrapping Radix UI and Tailwind CSS custom variables:

1. **Actions:**
   - `Button`: Primary (high-contrast), Secondary (subtle surface), Ghost (minimal text/icon), Destructive (danger-accented).
   - `IconButton`: Accessible button with explicit tooltip or `aria-label`.
2. **Surfaces & Cards:**
   - `Card`: Density-aware container with 1px `var(--border)` and `var(--surface)` background.
   - `Separator`: Subtle 1px structural dividing hairline.
3. **Overlays:**
   - `Dialog`: Accessible modal container with backdrop blur, focus trap, and Escape dismissal.
   - `DropdownMenu`: Keyboard-navigable contextual action lists.
   - `Tooltip`: Instant micro-guidance with WCAG contrast guarantee.
4. **Data Presentation:**
   - `EmptyState`: Canonical empty state showing illustration/icon, title, explanation, and primary call-to-action.
   - `StatusIndicator`: Pulse/solid status dot paired with explicit semantic text.
   - `Badge`: Metadata tag for statuses (Scheduled, Draft, Published, Failed).

