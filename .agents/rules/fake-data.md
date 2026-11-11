# Rule: Zero Fabricated Telemetry / Data Authenticity

1. **No Fake Metrics as Production Values:**
   - Do not display fabricated chart series, random follower spikes, or fictitious reach percentages as live production statistics.
   - When actual tenant metrics are unpopulated or an account is newly connected, render an authentic `EmptyState` component with clear setup guidance.

2. **Visual Skeleton & Error States:**
   - Asynchronous data fetching must show structured `Skeleton` loaders matching real table/card geometries, never generic infinite spinners.
   - API failures must show actionable error states with retry affordances.

