# AutoCanvas — Design QA & Release Gates

> Every release candidate must pass all 14 criteria before production deployment.

---

## 14-Point Design Acceptance Checklist

| # | Criterion | Verification Tool | Pass Standard |
|---|---|---|---|
| 1 | **Distinctive Brand Identity** | Visual review | Direction B ("The Frame" + Amber) consistently rendered |
| 2 | **Consistent Dual Themes** | Theme toggle | Light & Dark render with zero visual artifacts |
| 3 | **Shared Semantic Tokens** | Code grep | Zero raw `#hex` values in JSX outside `index.css` |
| 4 | **No Competing Component Systems** | Code audit | All UI elements derive from `components/ui/` |
| 5 | **Functional User Journeys** | End-to-end test | Business Owner, Social Manager, and Agency flows complete |
| 6 | **Responsive Layouts** | Viewport resizing | Verified at 1440px, 1024px, 768px, and 375px |
| 7 | **Creative Studio Recovery** | Session refresh | Canvas scene graph recovers without data loss |
| 8 | **Keyboard Accessibility** | Tab navigation | All core controls accessible via keyboard |
| 9 | **WCAG 2.2 AA Audit** | axe-core CLI | 0 violations on primary navigation and core flows |
| 10 | **Data Authenticity** | Data audit | Zero static mock arrays posing as live metrics |
| 11 | **Playwright Visual Baselines** | Playwright test | Pixel diffs < 0.1% against approved baselines |
| 12 | **Comprehensive States** | UI inspection | Empty, loading, error, and partial states implemented |
| 13 | **Zero Dead Controls** | Interaction test | Every clickable button has a functional handler |
| 14 | **Permissive License Audit** | `npm audit` | 100% MIT / Apache-2.0 / BSD / ISC licenses |

