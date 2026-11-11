# Rule: Accessibility (WCAG 2.2 AA Compliance)

1. **Semantic HTML & ARIA:**
   - Every interactive control must be a native `<button>`, `<a>`, or `<input>`, or provide appropriate `role`, `tabIndex={0}`, and keyboard handlers.
   - Navigation containers must have `role="navigation"` and descriptive `aria-label`.
   - Active navigation items must indicate state using `aria-current="page"`.
   - Toggles and expandable menus must maintain `aria-expanded` and `aria-controls`.

2. **Visible Focus Rings:**
   - Never suppress outline or focus rings (`outline-none`) without providing an explicit replacement.
   - All interactive controls must exhibit an accessible focus ring using `var(--focus-ring)` with adequate offset.

3. **Non-Drag Alternatives:**
   - Any drag-and-drop workflow (e.g. calendar rescheduling, creative canvas layers) must provide keyboard and click-based alternatives.

4. **Screen Reader Content:**
   - Icon-only buttons must provide an explicit `aria-label` or visually hidden text (`sr-only`).
   - Dynamic status changes (e.g. Emergency Pause, publish success/failure) must announce to assistive technology via `aria-live="polite"` or `role="status"`.

