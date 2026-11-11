---
name: accessibility-audit
description: "Accessibility auditing workflow ensuring WCAG 2.2 AA compliance across all AutoCanvas frontend components, forms, canvas editors, and navigation shells."
---

# Accessibility Audit Skill

## Checklist for Every Interface
1. **Contrast Verification:**
   - Text vs Background: Minimum 4.5:1 (normal text) and 3:1 (large text / UI controls).
   - Amber Accent: Strictly restricted to non-text decoration, icons with 3:1 contrast, or dark text on amber backgrounds.
2. **Keyboard Trapping & Flow:**
   - Tab index follows a logical DOM progression.
   - Modals and drawers lock focus inside the overlay and restore focus upon dismissal.
   - Escape key dismisses all popovers, dropdowns, and modals.
3. **Canvas Accessibility:**
   - Any visual element manipulated on canvas must have corresponding keyboard controls or property panel inputs.
4. **Automated Verification:**
   - Execute axe-core via Playwright test runners before declaring any view complete.

