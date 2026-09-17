---
name: VisionAI Editorial
colors:
  surface: '#f9f9f6'
  surface-dim: '#dadad7'
  surface-bright: '#f9f9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f1'
  surface-container: '#eeeeeb'
  surface-container-high: '#e8e8e5'
  surface-container-highest: '#e2e3e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#45474c'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f1f1ee'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#0a0054'
  on-tertiary: '#ffffff'
  tertiary-container: '#18008f'
  on-tertiary-container: '#8481ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#e2dfff'
  tertiary-fixed-dim: '#c3c0ff'
  on-tertiary-fixed: '#0f0069'
  on-tertiary-fixed-variant: '#3323cc'
  background: '#f9f9f6'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e0'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system delivers a poised, editorial aesthetic for artificial intelligence and machine perception tooling. It rejects cliché cyberpunk tropes, neon-green terminal screens, and low-fidelity dark canvas modes. Instead, it frames cutting-edge machine learning inference—such as ResNet50 classification pipelines and YOLO11s 80-class object detection streams—within a calm, gallery-grade analytical environment. 

The aesthetic synthesizes modern Swiss layout disciplines with warm, tactile architectural sensibilities. The experience evokes the feeling of reviewing architectural plates or high-end scientific monographs: pristine typography, breathable structural whitespace, crisp low-contrast delineations, and targeted semantic accents. The user interface remains deliberately quiet, allowing user imagery, inference bounding volumes, and probability curves to command primary visual attention while maintaining an unmistakable air of institutional authority, rigor, and craft.

## Colors

The palette is anchored by a warm architectural off-white (`#FAFAF7`), avoiding sterile, fluorescent digital whites. Depth and hierarchy are achieved through a curated hierarchy of deep slates and semantic chroma accents:

- **Canvas & Surface Base**: `#FAFAF7` serves as the global canvas background. Card surfaces, inspection sheets, and active inspector panes float on pure white (`#FFFFFF`) to establish subtle, organic foreground-background separation.
- **Primary Accent (`#1E293B`)**: A deep mineral slate used for foundational typography, primary action buttons, structural borders, and prominent navigation elements.
- **Secondary & Tertiary Accents (`#3B82F6`, `#4F46E5`)**: Technical blue and deep indigo represent computational processing, model state transitions, primary selection nodes, and top-tier classification certainty scores.
- **Detection & Class Accents**: Applied selectively to multi-class detection bounding tags, confidence meters, and visual semantic anchors:
  - *Emerald Green (`#10B981`)*: High-confidence inference (>90%), valid classifications, and model pass states.
  - *Soft Coral (`#F43F5E`)*: Object anomalies, attention points, and critical class warnings.
  - *Amber (`#F59E0B`)*: Mid-tier confidence thresholds (50–80%) and pending processing streams.
  - *Soft Lavender (`#8B5CF6`)*: Secondary semantic groupings and contextual feature maps.
- **Structural Borders**: Neutral boundaries utilize a soft slate-stone tint (`#E2E8F0` / `rgba(30, 41, 59, 0.08)`), preserving razor-sharp geometric separation without heavy dark lines.

## Typography

The typographic hierarchy pairs the human-centric geometric balance of **Plus Jakarta Sans** for prominent headers with the utilitarian precision and rhythmic clarity of **Inter** for reading text, analytical dashboards, metadata outputs, and detection badges.

- **Headlines**: Express architectural clarity. Tighter letter spacing on `headline-xl` and `headline-lg` grounds analytical sections and primary screen headers.
- **Body Content**: Inter maintains optical legibility even when rendering dense statistical parameters, model hyperparameters, or multi-paragraph scientific summaries.
- **Labels & Microcopy**: Small inference badges, bounding box indicators, and telemetry readouts (`label-sm`, `label-md`) use medium and semi-bold weights with slight positive tracking to ensure instant legibility across complex image canvases. Tabular numbers (`tnum`) should be enabled for all coordinate, latency, and confidence score displays.

## Layout & Spacing

Layouts follow a structured 12-column grid system bounded by generous external margins (`margin` at 40px desktop, scaleable down to 20px on mobile). The layout philosophy balances structured data panels with sprawling viewing ports for high-resolution visual inputs.

- **Grid & Columns**: A 12-column fluid grid system with 24px gutters across desktop breakpoints (`>= 1024px`). Inspector panels typically occupy 4 columns while the interactive model inference viewport occupies the remaining 8 columns.
- **Adaptive Breakpoints**:
  - *Desktop (`>= 1024px`)*: Side-by-side analytical composition; split canvas with persistent metric sidebars and sticky detection streams.
  - *Tablet (`768px - 1023px`)*: 8-column layout with collapsable inference sidebars and floating floating-action inspector sheets.
  - *Mobile (`< 768px`)*: Single-column linear stack with 16px gutters and 20px page margins. The image canvas anchors top-of-screen, with swipeable tabbed drawers for ResNet50 class distributions and YOLO detection manifests.
- **Rhythm**: All spatial spacing strictly references the 4px baseline (`0.25rem`), utilizing `space-md` for standard component internals and `space-xl` for sectional structural delineation.

## Elevation & Depth

Depth in this system avoids harsh drop shadows and heavy multi-tiered elevations. It relies on a combination of warm tonal layering, crisp low-contrast borders, and ultra-diffuse ambient occlusion shadows:

- **Surface Stratification**:
  - *Base Canvas*: `#FAFAF7`.
  - *Secondary Wells / Sub-panels*: `#F3F4F0` (recessed input drops, model metric wells, parameter trays).
  - *Primary Cards & Viewports*: `#FFFFFF` with a razor-thin border (`1px solid rgba(30, 41, 59, 0.08)`).
- **Ambient Shadow Stack**:
  - *Card Base Elevation*: `0px 2px 8px -2px rgba(30, 41, 59, 0.04), 0px 1px 3px -1px rgba(30, 41, 59, 0.03)`.
  - *Floating Viewports & Hover States*: `0px 12px 32px -4px rgba(30, 41, 59, 0.06), 0px 4px 12px -2px rgba(30, 41, 59, 0.03)`.
  - *Active Overlays & Modals*: `0px 24px 48px -12px rgba(30, 41, 59, 0.12)`.
- **Bounding Box Focus Depth**: Bounding box overlays drop a delicate `0 0 0 1px #FFFFFF` halo behind their colored bounding borders, ensuring visual pop irrespective of light or dark image backgrounds beneath.

## Shapes

The interface embraces a modern, friendly, yet rigorous shape profile. Major structural surfaces, inspection cards, and image preview stages use rounded corners (16px to 24px), providing an editorial framing effect that softens technical instrumentation.

- **Primary Cards and Analysis Containers**: Standardized at `rounded-lg` (16px / `1rem`) and `rounded-xl` (24px / `1.5rem`) for primary hero viewports.
- **Buttons, Form Elements, and Filters**: Set at `rounded` (8px / `0.5rem`) to establish tactile, dependable interactive bounds.
- **Class Badges, Confidence Tags, and YOLO Overlays**: Formed with tight `rounded-sm` (4px to 6px) contours to maintain crisp data density without obscuring underlying image pixels.

## Components

### Buttons
- **Primary**: Deep slate surface (`#1E293B`) with white text, 8px corner radius, standard 10px 18px padding, transitioning to `#0F172A` on hover. Accompanied by micro-haptic scale shifts (0.985 active state).
- **Secondary**: Pure white container (`#FFFFFF`), 1px border (`rgba(30, 41, 59, 0.12)`), text in `#1E293B`. Hover state applies `#FAFAF7` background with `#0F172A` border.
- **Ghost / Tool Buttons**: Transparent background with `#475569` icon and text; subtle hover fill in `rgba(30, 41, 59, 0.04)`.

### Computer Vision Bounding Boxes (YOLO11s)
- **Bounding Canvas Lines**: 1.5px or 2px solid vector frames colored dynamically by class family (e.g., `#3B82F6` for humans/vehicles, `#10B981` for animals/nature, `#F43F5E` for safety hazards). 
- **Object Annotation Tag**: Positioned at the top-left coordinate of detection; compact padding (2px 6px), 4px radius, filled with high-opacity matching class accent, displaying object class in `label-sm` along with formatted confidence (e.g., `person 94.2%`).
- **Detection Hover State**: Hovering over an analytical list item highlights the corresponding bounding box with a 4px translucent outer bloom and an instant elevation pulse.

### Metric & Analytics Cards (ResNet50)
- **Card Framing**: Crisp white canvas with 16px radius, bordered by `rgba(30, 41, 59, 0.08)`. Generous internal padding (20px to 24px).
- **Probability Bars**: Clean horizontal distribution tracks with a recessed background (`#F1F5F9`), containing smooth, non-striped pill fills in primary blue or emerald depending on top-1 confidence rankings.
- **Metadata Badges**: Latency, tensor shape, batch size, and FPS are formatted in clean mono-spaced or tabular digits inside muted quartz pills (`#F8FAFC`, border `#E2E8F0`).

### Form Controls & Inputs
- **Text Inputs & Threshold Sliders**: 8px border radius, clear `#FFFFFF` background with an unyielding 1px `#E2E8F0` resting edge. Focused inputs switch to a 1.5px `#3B82F6` ring with zero heavy exterior spread.
- **Checkboxes & Radios**: 8px rounded corners for toggles; custom check markers in deep slate (`#1E293B`) or indigo (`#4F46E5`), eschewing generic browser defaults.

### Chips & Confidence Filter Pills
- Compact height (28px), 6px border radius, flexible semantic badges displaying detection category counts. Active filter states use `#1E293B` fill with white text, while idle states utilize `#FFFFFF` fill with an understated border.