# Rule: Motion & Interaction Craft

1. **Respect Reduced Motion:**
   - All motion must honor `prefers-reduced-motion: reduce`.
   - In CSS, provide `@media (prefers-reduced-motion: reduce)` rules that collapse animation durations and transitions to zero.
   - In React components using Motion, verify reduced motion via `useReducedMotion()`.

2. **Purposeful Kinetic Feedback:**
   - Motion communicates spatial relationships, elevation shifts, and state transitions.
   - Avoid decorative floating or pulsing animations that induce cognitive fatigue.
   - Standard timing scale:
     - Micro-interactions (hover, click, toggle): 100ms–150ms
     - Surfaces / Menus / Dialogs: 180ms–240ms
     - Sheet / Drawer transitions: 240ms–320ms

