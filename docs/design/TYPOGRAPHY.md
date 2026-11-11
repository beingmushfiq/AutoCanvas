# AutoCanvas Typography Architecture

## 1. Typeface Stack
1. **Primary Interface:** `Geist Sans`
   - Engineered by Vercel for high-density interfaces and data density.
   - Weights in use: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold).
2. **Telemetry, Timestamps & Code:** `Geist Mono`
   - Used for all dates, post IDs, counters, token accounting, and technical readouts.
   - Employs `tabular-nums` (`font-variant-numeric: tabular-nums`) to prevent layout jitter during data updates.
3. **Multilingual (Bengali):** `Noto Sans Bengali`
   - Full support for South Asian and Bengali script typography without glyph clipping or vertical alignment degradation.

## 2. Typographic Scale

| Role | Font Size (Comfortable) | Font Size (Compact) | Line Height | Tracking | Weight |
|---|---|---|---|---|---|
| Display | 2.25rem (36px) | 1.875rem (30px) | 1.2 | -0.025em | 700 |
| Page Title (H1) | 1.5rem (24px) | 1.25rem (20px) | 1.25 | -0.02em | 600 |
| Section Title (H2) | 1.25rem (20px) | 1.0625rem (17px) | 1.3 | -0.015em | 600 |
| Subsection (H3) | 1.0625rem (17px) | 0.9375rem (15px) | 1.35 | -0.01em | 600 |
| Body | 0.875rem (14px) | 0.8125rem (13px) | 1.5 | 0 | 400 / 500 |
| Small / Label | 0.8125rem (13px) | 0.75rem (12px) | 1.4 | +0.01em | 500 |
| Caption / Metadata | 0.75rem (12px) | 0.6875rem (11px) | 1.4 | +0.02em | 500 |

