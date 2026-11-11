# AutoCanvas Color Architecture

## 1. OKLCH Perceptual Uniformity
AutoCanvas utilizes the OKLCH color model for predictable luminance across both light and dark themes.

### Three-Layer Token Contract
1. **Primitives:** Raw mathematical color coordinates (`--primitive-neutral-*`, `--primitive-amber-*`).
2. **Semantics:** Meaningful UI roles (`--background`, `--surface`, `--foreground`, `--border`, `--brand-accent`).
3. **Components:** Specific instances (`--nav-item-active-mark`, `--focus-ring`, `--card-border`).

## 2. Contrast & WCAG 2.2 AA Compliance Matrix

| Token Role | Light Mode Value | Dark Mode Value | Target Contrast |
|---|---|---|---|
| `--foreground` on `--background` | `oklch(14% 0.003 265)` on `oklch(98.5% ...)` | `oklch(96% ...)` on `oklch(10% ...)` | > 12:1 (AAA) |
| `--foreground-secondary` on `--surface` | `oklch(44% ...)` | `oklch(72% ...)` | > 5.5:1 (AA) |
| `--foreground-muted` on `--surface` | `oklch(56% ...)` | `oklch(55% ...)` | > 4.5:1 (AA) |
| `--border` on `--background` | `oklch(92% ...)` | `oklch(22% ...)` | > 3:1 (UI Components) |
| `--brand-accent` (Amber) | `oklch(68% 0.18 60)` | `oklch(76% 0.17 65)` | ≥ 3:1 against dark/light borders & indicators |

> [!WARNING]
> Amber text on a light background fails the 4.5:1 contrast requirement for standard body copy. Therefore, Amber is strictly restricted to icons, active status bars, focus rings, and badges with dark text (`--interactive-primary-fg`).

