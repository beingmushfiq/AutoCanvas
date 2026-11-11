# AutoCanvas Motion Guidelines

## 1. Principles
- **Functional, Not Decorative:** Motion explains state transformations, layer depth, and spatial navigation.
- **Immediate Response:** Micro-interactions must feel instant (< 120ms).
- **Reduced Motion First:** All animations must respect user preferences (`prefers-reduced-motion: reduce`).

## 2. Timing & Easing Curves

| Purpose | Duration | Easing Curve | Use Case |
|---|---|---|---|
| Micro-interaction | 100ms–140ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Button press, checkbox toggle, hover highlight |
| Surface Transition | 180ms–220ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Dropdown expansion, modal fade/scale |
| Drawer / Sheet Slide | 240ms–300ms | `cubic-bezier(0, 0, 0.2, 1)` | Sidebar collapse, inspector slide-out |

## 3. Reduced Motion Policy
When `prefers-reduced-motion: reduce` is active:
- CSS transitions are reduced to `0ms`.
- Transforms and scales are disabled; opacity fades replace slide animations.
- Canvas animation frames halt automatic loops.

