# AutoCanvas — Content Studio UX & Interaction Architecture

> The Content Studio is the primary writing, prompt orchestration, and multi-channel adaptation workspace.

---

## 1. Information Architecture & Spatial Layout

The Content Studio employs a responsive split-view workspace designed to eliminate context-switching:

```
+-----------------------------------------------------------------------------------------+
| Top Context Bar: Brand Selector | Content Pillar | Target Campaign | Save State Indicator|
+------------------------------------+----------------------------------------------------+
| LEFT: Source Inspiration & Drafts  | RIGHT: Multi-Platform Editor & Preview             |
|                                    |                                                    |
| - Selected Trend Opportunity       | Platform Tabs: [ LinkedIn ] [ Instagram ] [ FB ]   |
| - Brand Voice Guidelines Card      | - Platform-specific caption editor                 |
| - Pillar & Format Selectors        | - Live character & hashtag counter with limits     |
| - Generation History Stack         | - Originality & Risk Score readout                 |
| - "Generate Variations" Button     | - Branded Visual Preview card                      |
|                                    | - Action Bar: [Save Draft] [Send to Review]        |
+------------------------------------+----------------------------------------------------+
```

---

## 2. Platform Constraint Matrix

Every platform tab enforces exact length, link, and hashtag rules:

| Platform | Max Characters | Recommended Length | Max Hashtags | Link Behavior |
|---|---|---|---|---|
| **LinkedIn Company** | 3,000 | 800–1,500 | 3–5 | Rich link card or first-comment hook |
| **Instagram Professional** | 2,200 | 300–800 | 30 (5–10 recommended) | Link in Bio or Story Sticker |
| **Facebook Page** | 63,206 | 250–500 | 1–3 | Native OpenGraph card |

---

## 3. Originality & QA Risk Engine UX

1. **Originality Score:** An editorial metric (0–100%) indicating how uniquely the draft differentiates from competitor posts ingested in the Research Radar.
2. **Compliance Badges:**
   - `Green`: 100% compliant with brand safety rules.
   - `Amber`: Contains sensitive topic or unverified factual claim (shows source citation link).
   - `Red`: Violates negative brand keywords or competitor trademark rules (blocks one-click scheduling).

