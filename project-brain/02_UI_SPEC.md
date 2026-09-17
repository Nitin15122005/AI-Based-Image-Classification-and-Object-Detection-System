# 02 — UI Specification

Visual source of truth: `frontend/stitch-design/` (static HTML prototype, 5 screens) + `frontend/stitch-design/visionai_editorial/DESIGN.md` (design system tokens). This file governs what must be *built*; the Stitch folder governs what it must *look like*.

## Design System Summary
- **Theme**: premium light, editorial/product aesthetic (architectural monograph feel) — explicitly not a dark admin dashboard.
- **Color**: warm off-white canvas `#FAFAF7`/`#F9F9F6`, white card surfaces, deep slate primary (`#1E293B`/`#091426`), technical blue secondary (`#0058BE`/`#3B82F6`), indigo tertiary. Semantic accents: emerald `#10B981` (high confidence), amber `#F59E0B` (mid confidence), coral `#F43F5E` (warnings/anomalies), lavender `#8B5CF6` (secondary groupings). Full token list in the Stitch `DESIGN.md`.
- **Typography**: Plus Jakarta Sans for headlines (xl/lg/md/sm scale), Inter for body/labels/metadata. Tabular numbers for confidence/coordinate/latency values.
- **Shape**: cards `rounded-lg`/`rounded-xl` (16–24px), buttons/inputs `rounded` (8px), badges/overlays `rounded-sm` (4–6px).
- **Elevation**: soft, diffuse shadows only — no heavy drop shadows; thin `rgba(30,41,59,0.08)` borders define surfaces.
- **Layout**: 12-column grid, 24px gutters desktop; generous margins (40px desktop / 20px mobile); 4px spacing baseline.

## Global Components
- Top navigation (Home, Analyze, History, Models & Metrics), consistent across pages.
- Image dropzone/upload control.
- Bounding-box overlay renderer (canvas or absolutely-positioned SVG over the image), class-colored, with label + confidence tag.
- Confidence bar/pill component (used in classification top-K lists and metric cards).
- Data table (History list, per-class performance).
- Toast/inline alert component (errors, backend unavailable).
- Loading/progress indicator (upload + analyze states).
- Metric card (single-value stat, used on Home preview and Models & Metrics).
- Chart components: line/curve (training curves), bar (per-class metrics), heatmap or matrix grid (confusion matrix) — via Recharts or equivalent.

## Pages

### 1. Home
- Hero section (product name, one-line value proposition, primary CTA to Analyze).
- Product explanation section (what it does: detect + classify).
- Detection + classification showcase (sample annotated image or illustrative visual).
- "How it works" workflow section (upload → detect → classify → results, 3–4 steps).
- Feature cards (bounding boxes, confidence scores, history, metrics — one card each).
- Model performance preview (headline metrics pulled from Models & Metrics data, e.g., mAP50, Top-1 Accuracy).
- Supported COCO classes preview (sample of the 80 classes, e.g., chip list or grid).

### 2. Analyze
- Drag-and-drop upload zone + file picker fallback.
- Image preview after selection.
- Image information (filename, dimensions, file size, format).
- Analysis settings panel: confidence threshold control (slider/input).
- "Analyze" action button.
- Loading/progress state while inference runs.
- Error state (invalid file, upload failure, inference failure) with retry.

### 3. Results
- Original image panel.
- Annotated image panel (bounding boxes + labels rendered).
- Original vs. annotated side-by-side or toggle comparison.
- Summary metrics row (object count, processing time, average confidence).
- Detected objects table (class, bounding box coords, detection confidence, classification, classification confidence).
- Top-5 classification breakdown per selected object (expandable row or side panel).
- Optional AI-generated plain-language summary of the result.
- Actions: download annotated image, download result JSON, save to history (may be automatic), "Analyze another image".

### 4. History
- List/grid of previous analyses: thumbnail, filename, date/time, detected-object count, top/average confidence.
- Search (by filename), filter (by date range / class / confidence), sort (by date, object count, confidence).
- Click-through to History Details.
- Empty state when no history exists yet.

### 5. History Details
- Full reopened result: original image, annotated image, detections, classifications, processing time (identical structure to Results page, populated from saved data).
- Actions: download, delete entry, "run again" (re-submit the stored image through Analyze).

### 6. Models & Metrics
- Model info cards: YOLO11s (architecture, input size, training data) and ResNet50 (architecture, backbone, training data).
- Detection metrics: Precision, Recall, mAP50, mAP50-95 (plus training curves).
- Classification metrics: Top-1 Accuracy, Top-5 Accuracy, Balanced Accuracy, Precision, Recall, Macro F1, Weighted F1.
- Confusion matrix (classification).
- Per-class performance table (both models where applicable).
- Model/device information (framework versions, GPU/CPU used for training and for serving).
- All values sourced from saved evaluation artifacts in `ml/` — never hardcoded/fabricated.

## User Flow (Primary Path)
Home → (CTA) → Analyze → upload image → set threshold (optional) → Analyze → loading → Results (auto-saved to History) → download / analyze another → History → History Details → (optional) run again.
Secondary entry: Home → Models & Metrics (evaluate the system before trusting it).

## Responsive Behavior
- **Desktop (≥1024px)**: side-by-side panels (e.g., original/annotated, table + detail); persistent nav; multi-column feature/metric grids.
- **Tablet (768–1023px)**: reduced columns, collapsible side panels, stacked comparison where needed.
- **Mobile (<768px)**: single-column stack, image canvas first, tabbed/drawer access to detection list and classification detail, 16px gutters.
- No horizontal scrolling except within explicitly scrollable tables/wide charts.

## Accessibility
- Sufficient color contrast for text on light surfaces (WCAG AA target for body text).
- All interactive controls (upload zone, buttons, sliders, table sort/filter) keyboard-operable and focus-visible.
- Images have descriptive `alt` text (original vs. annotated distinguished).
- Bounding-box color coding must not be the sole signal — always paired with a text label.
- Loading and error states announced to assistive tech (e.g., `aria-live` regions for status changes).

## Stitch → React Conversion Requirements
- Do not ship the static HTML as-is; decompose each Stitch screen into reusable React components matching the Global Components list above.
- Recreate the design tokens (colors, type scale, spacing, radii) as Tailwind theme config, not inline styles copy-pasted from Stitch.
- Replace static/sample data in the Stitch prototype with real API-driven state (loading/error/success) per page.
- Preserve the visual system (spacing, type, color, shadow) exactly as specified in the Stitch `DESIGN.md` unless a deliberate, documented change is made.
- Routing: each of the 6 pages becomes a React Router route; navigation matches the Stitch prototype's implied structure.

## UX States (must be implemented, not just happy path)
- **Empty** — no image selected yet (Analyze), no history yet (History).
- **Uploading** — file transfer in progress.
- **Uploaded** — file accepted, preview shown, ready to analyze.
- **Analyzing** — inference in progress (loading/progress indicator).
- **Success** — result rendered (Results/History Details).
- **Error** — upload rejected, inference failed, network error (with actionable message).
- **No detections** — inference succeeded but found zero objects (distinct from error).
- **History empty** — no saved analyses yet.
- **Backend unavailable** — API unreachable; UI communicates this clearly and does not appear broken/blank.
