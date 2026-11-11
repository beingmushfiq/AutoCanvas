---
name: visual-regression-qa
description: "Visual regression testing workflow using Playwright and screenshot baselines across desktop, tablet, and mobile viewports."
---

# Visual Regression QA Skill

## Protocol
1. **Baseline Viewports:**
   - Desktop: 1440 × 900
   - Tablet: 768 × 1024
   - Mobile: 375 × 812
2. **Dual-Theme Verification:**
   - Every screenshot baseline must be captured in both `data-theme="light"` and `data-theme="dark"`.
3. **Determinism:**
   - Freeze mock dates/times.
   - Disable asynchronous animations (`prefers-reduced-motion` enabled or animation duration set to 0).
   - Ensure web fonts are fully loaded before capturing snapshots.

