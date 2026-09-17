# 01 — Requirements (Concise SRS)

Legend: **[M]** Mandatory · **[O]** Optional

## Functional Requirements
1. **[M]** Upload an image (drag/drop + file picker).
2. **[M]** Detect multiple objects in the image via YOLO11s.
3. **[M]** Draw bounding boxes on an annotated copy of the image.
4. **[M]** Show detected class name per box.
5. **[M]** Show detection confidence per box.
6. **[M]** Classify each detected object crop via ResNet50.
7. **[M]** Show classification confidence.
8. **[M]** Show top-K (top-5) classification predictions per object.
9. **[M]** Show total processing time for an analysis.
10. **[M]** Display original vs. annotated image (comparison view).
11. **[M]** Download the annotated image.
12. **[O]** Download the raw result JSON.
13. **[M]** Save each analysis to history; list, search, filter, sort history.
14. **[M]** Reopen a previous analysis with full original results (History Details).
15. **[O]** Delete a history entry; re-run analysis on a history entry's image.
16. **[M]** View model performance/evaluation metrics and artifacts (Models & Metrics page).
17. **[O]** Confidence-threshold control on the Analyze page.
18. **[O]** AI-generated plain-language summary of a result on the Results page.

## Non-Functional Requirements
- **Usability**: image-first, premium light editorial UI; no jargon-only UX; clear feedback for every async action.
- **Responsiveness**: desktop, tablet, and mobile layouts all functional (not just desktop-shrunk).
- **Performance**: single-image inference should complete and render within a few seconds on typical hardware (GPU inference where available; CPU fallback acceptable but should surface actual processing time honestly).
- **Reliability**: API failures, timeouts, and "backend unavailable" must degrade gracefully in the UI (see UX states in `02_UI_SPEC.md`).
- **Maintainability**: frontend talks to the backend only through a defined API/service layer (no inline fetch scattered across components); inference logic isolated from HTTP routing.
- **Reproducibility**: dataset sampling for training/validation must be deterministic (fixed seed, documented split).
- **Honesty**: all reported metrics come from real training/evaluation runs. Never fabricate, estimate, or placeholder numbers on the Models & Metrics page.

## ML Requirements
- Dataset: COCO 2017, 80 classes.
- Detection: YOLO11s, pretrained weights + transfer learning/fine-tuning on a COCO train2017 subset; COCO val2017 held out and untouched for training, used only for evaluation.
- Classification: ResNet50, pretrained weights + transfer learning, fine-tuned on object crops generated from COCO bounding-box annotations (80 classes).
- Deterministic sampling of train/val subsets (fixed seed, recorded in code/config).
- Detection evaluation metrics: Precision, Recall, mAP50, mAP50-95.
- Classification evaluation metrics: Top-1 Accuracy, Top-5 Accuracy, Balanced Accuracy, Precision, Recall, Macro F1, Weighted F1.
- Persist: best detection model weights, best classifier weights, training curve plots, prediction examples (detection), confusion matrix + classification report (classification), error analysis notes.
- Training environment: Google Colab, NVIDIA T4 GPU.

## Backend Requirements
- FastAPI REST API.
- Endpoint(s) accepting image upload and returning a structured JSON result (see `03_ML_BACKEND.md` for exact shape).
- Endpoints to list/retrieve/delete history entries.
- Endpoint(s) to serve model metrics/evaluation artifacts to the frontend.
- Endpoint to serve/download annotated images.
- Inference layer (YOLO detect → crop → ResNet classify → merge) implemented as a separable module, not embedded in route handlers.
- Large model weights and datasets excluded from the API's working assumptions about repo storage (see deployment notes in `03_ML_BACKEND.md`).

## Frontend Requirements
- React + Vite + Tailwind CSS + React Router; charts via Recharts (or equivalent).
- Six pages: Home, Analyze, Results, History, History Details, Models & Metrics (full spec in `02_UI_SPEC.md`).
- All backend communication routed through dedicated API/service functions (e.g., `src/services/api.js` or similar), not ad hoc calls inside components.
- Stitch static HTML prototype (`frontend/stitch-design/`) is the visual source of truth, to be converted into componentized, stateful React — not copied as static markup.
- All UX states from `02_UI_SPEC.md` must be implemented, not just the happy path.

## Performance / Reliability (Acceptance-Relevant)
- Processing time is measured and displayed for every analysis, end-to-end (upload received → results ready).
- The system must handle "no objects detected" without erroring.
- The system must handle backend-unavailable without a blank/broken UI.
- History must persist across sessions (not just in-memory/client state).

## Acceptance Criteria
A capstone submission is considered complete when:
1. A user can upload an image and receive a full result (detections + classifications + annotated image + processing time) through the deployed UI, not just via API calls in a notebook.
2. Detection and classification models are trained (not zero-shot-only) and their real evaluation metrics are visible on the Models & Metrics page, matching saved artifacts (plots, confusion matrix, reports) in `ml/`.
3. History save/review works end-to-end (create → list → reopen).
4. All six pages exist, are responsive, and implement their required UX states.
5. The dataset and model weights are not committed to Git; large-artifact handling (LFS/releases/cloud storage) is documented and functional if used.
6. The repository shows progressive, meaningful commits following the defined GitHub workflow order.

## Mandatory vs. Optional Summary
- **Mandatory**: items 1–11, 13–14, 16 under Functional Requirements; all ML/Backend/Frontend requirements above; all Acceptance Criteria.
- **Optional** (nice-to-have, do not block acceptance): result JSON download, delete/re-run from history, confidence-threshold UI control, AI-generated result summary.
