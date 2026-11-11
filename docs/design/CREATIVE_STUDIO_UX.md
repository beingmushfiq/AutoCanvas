# AutoCanvas — Creative Studio UX & Interaction Architecture

> The Flagship Creative Studio delivers professional graphic editing ergonomics using React Konva, deterministic rendering, and full keyboard accessibility.

---

## 1. 3-Column Ergonomic Studio Layout

```
+-------------------------------------------------------------------------------------------------+
| Top Toolbar: Document Name | Brand Preset | Undo/Redo | Zoom Controls | Platform Safe Zones | Export|
+-------------------+---------------------------------------------+-------------------------------+
| LEFT PANEL (260px)| CENTER WORKSPACE (Canvas)                   | RIGHT INSPECTOR (300px)       |
|                   |                                             |                               |
| Tabs:             | - Infinite zoom & pan stage                 | Selected Element Properties:  |
| - Presets         | - Responsive Konva Canvas                   | - Position (X, Y)             |
| - Layouts         | - Platform-safe zone guides                 | - Dimensions (W, H)           |
| - Typography      | - Magnetic snap guides                      | - Rotation angle              |
| - Brand Vectors   | - Bounding box transform handles            | - Typography & Line Height    |
| - Image Uploads   | - Focus indicator outline                   | - Color picker (Brand tokens) |
|                   |                                             | - Layer Opacity & Order       |
+-------------------+---------------------------------------------+-------------------------------+
| BOTTOM DRAWER: Layer Hierarchy Tree (Keyboard navigable: Reorder, Hide, Lock, Delete)          |
+-------------------------------------------------------------------------------------------------+
```

---

## 2. Standard Canvas Dimension Presets

As established in ADR-006:
1. **Instagram / LinkedIn Square:** `1080 × 1080` (1:1 aspect ratio)
2. **Landscape Banner (Facebook / Twitter / LinkedIn):** `1200 × 628` (1.91:1 aspect ratio)
3. **Story / Reel (Instagram / TikTok):** `1080 × 1920` (9:16 aspect ratio)

---

## 3. Keyboard-Accessible Non-Drag Controls (WCAG 2.2 AA)

Canvas interaction cannot be restricted to mouse dragging:
- **Layer Selection:** Users can `Tab` through layers or select them from the bottom Layer Tree.
- **Micro-Nudge:** Arrow keys move the selected element by `1px`; `Shift + Arrow` moves by `10px`.
- **Property Panel Editing:** All dimensions, positions, font sizes, and color codes can be entered as exact numbers into accessible input fields in the Right Inspector.
- **Reordering Layers:** Accessible `Move Up` and `Move Down` buttons in the layer list.

---

## 4. Deterministic Export Pipeline
When the user clicks **Export** or schedules a post:
1. The canvas state is serialized into the versioned `CanvasLayerConfig` JSON.
2. The JSON is sent via REST API to the background Node.js/Chromium renderer.
3. The renderer uses Playwright to composite pixel-perfect PNG/JPEG files matching the exact vector font metrics.

