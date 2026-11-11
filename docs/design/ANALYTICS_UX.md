# AutoCanvas — Analytics UX & Data Visualization

> The Analytics experience provides actionable, authentic data visualization without vanity metrics or fake counters.

---

## 1. Core Visualizations (Recharts)
1. **Multi-Channel Cadence Area Chart:**
   - Visualizes generated vs published social items over weekly buckets.
   - Uses `var(--brand-accent)` for generated items and `var(--status-success)` for published items.
2. **Platform Engagement Bar Chart:**
   - Compares daily impressions and interactions across LinkedIn, Instagram, and Facebook.
   - Tooltips show exact tabular figures in Geist Mono.
3. **Audience Demographics & Best Time Heatmap:**
   - 7×24 grid showing optimal posting hours calculated from actual past post engagements.

---

## 2. Data Provenance & Empty States
- When a social account is freshly connected and API metrics are still syncing, the dashboard renders an authentic `EmptyState` explaining that platform data is being ingested.
- Distinguishes **Real Platform Metrics** (API-verified) from **System Telemetry** (jobs queued, tokens consumed).

