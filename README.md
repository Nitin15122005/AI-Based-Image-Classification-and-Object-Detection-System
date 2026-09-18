# VisionAI

VisionAI is a computer-vision web application for object detection and
image classification. Upload an image, and it detects objects with
bounding boxes, classifies both individual objects and the overall scene,
and gives you an annotated result you can inspect, export, and revisit
later from a searchable history.

The app is a full stack: a React frontend, a FastAPI backend backed by
PostgreSQL, and a real inference pipeline built on a pretrained Ultralytics
YOLO11s detector and a fine-tuned ResNet50 classifier.

## Features

- **Object detection** — YOLO11s locates objects in an uploaded image with
  bounding boxes and per-detection confidence scores, across the full
  80-class COCO vocabulary.
- **Image classification** — each detected object's crop, and the overall
  scene, is classified by a fine-tuned ResNet50, with top-5 predictions.
- **Configurable analysis** — toggle detection/classification independently
  and adjust the confidence threshold per request.
- **Results viewer** — Annotated / Original / Split View modes, box/label/
  confidence toggles, a per-class filter, and downloads for both the
  annotated image and the raw JSON result. Large or oddly-proportioned
  images stay fully visible in a scrollable viewport instead of being
  cropped or squeezed.
- **History** — every analysis is persisted; browse, search, re-run, or
  delete past results.
- **Models & Metrics** — live model metadata (architecture, device, class
  count) and real evaluation metrics: training curves, a confusion matrix,
  and a full per-class breakdown.
- **Mock mode** — the entire app also runs against a deterministic mock
  inference adapter, with no GPU or model weights required, for frontend
  development or CI.

## Architecture

```
React (Vite)  ──HTTP/JSON, multipart──▶  FastAPI  ──▶  ModelAdapter
   :5173                                   :8000          │
                                             │             ├─ RealInferenceAdapter
                                             │             │   (YOLO11s + ResNet50, CUDA/CPU)
                                             ▼             └─ MockInferenceAdapter
                                        PostgreSQL              (deterministic, no weights)
                                     (analyses, detections)
```

The frontend never talks to the models directly — it calls a small set of
JSON/multipart REST endpoints. The backend's `ModelAdapter` interface is
the only seam between "mock" and "real" inference: routes, Pydantic
schemas, and the database schema are identical either way, and which
adapter is live is controlled by a single `MODEL_MODE` setting.

## Technology stack

**Frontend** — React 18.3, Vite 5.4, Tailwind CSS 3.4, React Router 6.26,
Recharts 2.12, Lucide icons, ESLint.

**Backend** — FastAPI 0.115, Uvicorn, Pydantic 2.10 / pydantic-settings,
SQLAlchemy 2.0, PostgreSQL via the psycopg3 driver, Alembic migrations,
Pillow, pytest + httpx.

**ML** — PyTorch 2.11 + torchvision 0.26 (CUDA 12.8 build, CPU fallback),
Ultralytics 8.4 (YOLO11s), torchvision's ResNet50 with a fine-tuned
classification head.

## ML pipeline

Both models are loaded once, at process startup, via an `@lru_cache`d
singleton (`backend/app/services/inference.py`) — never reloaded per
request. Inference runs on CUDA when available and falls back to CPU
automatically.

For each analysis:

1. **Detect** — YOLO11s runs at `imgsz=640` with a fixed NMS IoU of `0.45`
   and a caller-supplied confidence threshold (default `0.25`).
2. **Crop** — each detection's box is clipped to the image bounds and
   cropped from the *original* (not resized) image, reproducing the
   training notebook's inference-time cropping exactly.
3. **Classify** — every crop, plus the full scene, is classified by
   ResNet50 after `Resize((224,224))` → `ToTensor()` → normalize with
   ImageNet mean/std — the same preprocessing used during training.
4. **Combine** — detection and classification results are merged without
   either overwriting the other, even when they disagree.

At load time, the adapter verifies that each checkpoint's class list
exactly matches the canonical 80-class COCO order and refuses to start if
it doesn't, so a mismatched checkpoint fails loudly instead of serving
silently wrong labels.

### Verified metrics

Measured on the held-out evaluation sets and read live by the API from
`ml_outputs/outputs/metrics/` (never hardcoded):

**Detection (pretrained YOLO11s COCO baseline, 4,952 validation images)**

| Precision | Recall | mAP50 | mAP50-95 |
|---|---|---|---|
| 70.5% | 57.7% | 63.2% | 46.4% |

**Classification (fine-tuned ResNet50)**

| Top-1 | Top-5 | Balanced Accuracy | Macro F1 | Weighted F1 |
|---|---|---|---|---|
| 73.0% | 91.6% | 73.0% | 72.3% | 72.9% |

The classification metrics above were measured on the classification
model's own object-crop evaluation set (ground-truth crops in, class label
out) — they describe how well ResNet50 classifies a crop it's given, not
the end-to-end accuracy of the detect-then-classify pipeline as a whole.

### Production vs. experimental model artifacts

- **Production detector** — the official **pretrained** Ultralytics YOLO11s
  COCO checkpoint (`yolo11s.pt`). Ultralytics auto-downloads it on first
  load if it isn't already present locally.
- **Production classifier** — the project's **fine-tuned** ResNet50
  (`ml_outputs/models/classification/best_classifier.pth`, epoch 15,
  val accuracy 0.7304).
- **Not used in production** — a fine-tuned YOLO11s detector also exists
  (`ml_outputs/models/detection/best_detection.pt`), the result of an
  earlier experiment (13 epochs on a 12k-image subset). It measured *below*
  the pretrained baseline (mAP50-95 0.418 vs. 0.464), so the pretrained
  checkpoint is what actually serves production requests. The fine-tuned
  run is kept only as a labeled comparison — surfaced in `GET /api/v1/metrics`
  under `detection_experiment` — never as the production number.

## API endpoints

All routes are served under the `/api/v1` prefix. Interactive docs are
available at `/docs` (Swagger) and `/redoc` once the backend is running.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Liveness check, including a real database connectivity check |
| POST | `/api/v1/analyze` | Multipart image upload → runs inference → persists → returns the full result |
| GET | `/api/v1/results/{id}/json` | Same response shape as `/analyze`, fetched by id |
| GET | `/api/v1/results/{id}/original-image` | Serves the original uploaded image |
| GET | `/api/v1/results/{id}/annotated-image` | Serves the rendered annotated image |
| GET | `/api/v1/history` | Paginated history list (`page`, `page_size`, `search`, `status`, `sort`) |
| GET | `/api/v1/history/{id}` | Full detail for one past analysis |
| DELETE | `/api/v1/history/{id}` | Deletes the analysis (detections cascade) and both image files |
| POST | `/api/v1/history/{id}/rerun` | Re-runs inference on the same original image as a new analysis |
| GET | `/api/v1/models` | Model metadata: architecture, framework, class count, device, status |
| GET | `/api/v1/metrics` | Real detection/classification metrics, training curves, confusion matrix, per-class table |

## Project structure

```
backend/
  app/
    api/            routes_analysis.py, routes_history.py, routes_models.py, routes_health.py
    services/       inference.py, mock_inference.py, model_adapter.py,
                     analysis_service.py, history_service.py, image_service.py, metrics_service.py
    utils/          coco_classes.py, storage.py, validation.py
    config.py, database.py, main.py, models.py, schemas.py
  alembic/          migrations
  tests/            pytest suite (conftest.py + test_*.py)
  requirements.txt, README.md

frontend/
  src/
    components/     analyze/, history/, home/, layout/, models/, results/, ui/
    pages/          HomePage, AnalyzePage, ResultsPage, HistoryPage, HistoryDetailsPage,
                     ModelsMetricsPage, NotFoundPage
    services/       api.js (backend client), mockStore.js (local mock store)
    data/, hooks/, layouts/, utils/
  stitch-design/    original UI design references (see Screenshots)

ml_outputs/         tracked evaluation artifacts (metrics, plots, logs) and model config JSON
                     — trained weight files themselves are gitignored, see below
project-brain/      planning/reference docs for the project
coco_detection_classification.ipynb   training & evaluation notebook (source of truth for the ML pipeline)
```

## Setup

### Backend

Requires Python 3.11–3.13 (3.14 currently lacks prebuilt wheels for some
dependencies) and a PostgreSQL 13+ server.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
cp .env.example .env          # then edit DATABASE_URL etc.
```

```sql
CREATE ROLE visionai WITH LOGIN PASSWORD 'visionai_dev_pw';
CREATE DATABASE visionai OWNER visionai;
CREATE DATABASE visionai_test OWNER visionai;   -- used only by pytest
```

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

See `backend/README.md` for the full setup guide, including running
migrations against the test database and the complete Alembic command
reference.

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # production build
npm run lint
```

## Environment / configuration

**`backend/.env`** (copy from `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon: append `?sslmode=require`) |
| `UPLOAD_DIR` / `RESULT_DIR` | Where original/annotated images are stored on disk |
| `MAX_UPLOAD_MB` | Upload size limit |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `MODEL_MODE` | `real` (default, production) or `mock` (dev/testing without weights) |
| `DETECTION_MODEL_PATH` / `CLASSIFICATION_MODEL_PATH` | Paths to the production model weights |
| `ML_OUTPUTS_DIR` | Path to the evaluation artifacts served by `/api/v1/metrics` |

**`frontend/.env.local`** (copy from `frontend/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (e.g. `http://localhost:8000`). Leave empty/unset to run against the built-in local mock store instead of a real backend. |

## Screenshots

The original UI design references — used to build the production frontend
— live under `frontend/stitch-design/`. These are design mockups, not
live captures of the running application:

- `frontend/stitch-design/visionai_home/screen.png` — Home
- `frontend/stitch-design/visionai_analyze/screen.png` — Analyze
- `frontend/stitch-design/visionai_results/screen.png` — Results
- `frontend/stitch-design/visionai_history/screen.png` — History
- `frontend/stitch-design/visionai_models_metrics/screen.png` — Models & Metrics

## Validation / testing

- **Backend**: 26 pytest tests across `test_analysis.py`, `test_health.py`,
  `test_history.py`, and `test_models.py` (`cd backend && pytest -v`). Tests
  force `MODEL_MODE=mock` and run against an isolated `visionai_test`
  database using a savepoint-based transactional pattern (each test rolls
  back cleanly, no teardown truncation needed) — they never require GPU
  access or model weights.
- **Frontend**: `npm run build` and `npm run lint` (ESLint) are both kept
  clean.
- **End-to-end**: the full flow — real image upload through the browser UI,
  real YOLO11s + ResNet50 inference, annotated image rendering, and
  PostgreSQL persistence — has been manually verified against the running
  stack, including History, Models & Metrics, and the Results page's
  Original/Annotated/Split View modes.

## Model artifact handling

Trained weight files (`*.pt`, `*.pth`) are excluded from git — see
`.gitignore`. What that means for a fresh clone:

- `yolo11s.pt` — **no action needed.** Ultralytics downloads the official
  pretrained checkpoint automatically the first time it's loaded.
- `ml_outputs/models/classification/best_classifier.pth` — **must be
  provided.** This is the project's own fine-tuned classifier; it isn't
  available anywhere else. Produce it by running
  `coco_detection_classification.ipynb`, or copy an existing checkpoint
  into place. The backend raises a clear error at startup if it's missing.
- `ml_outputs/models/detection/best_detection.pt` — optional. Only used for
  the experimental comparison shown in `/api/v1/metrics`; not required to
  serve real requests.

Everything else the ML pipeline depends on for evaluation — metrics JSON,
training curves, confusion matrices, per-class tables — is already tracked
under `ml_outputs/` and requires no regeneration.

## Usage notes

- Run the backend and frontend concurrently during development; set
  `VITE_API_BASE_URL` once the backend is up to switch the frontend from
  the local mock store to real inference.
- `CORS_ORIGINS` must include whatever origin Vite actually serves from —
  it defaults to covering both `5173` and `5174` on `localhost` and
  `127.0.0.1`, since Vite auto-increments the port if `5173` is taken.
- There is no containerized deployment setup yet; the frontend is a static
  Vite build (deployable to any static host) and the backend is a standard
  ASGI app (needs a reachable PostgreSQL database and, for real inference,
  a machine with the PyTorch/CUDA stack installed — CPU inference works but
  is slower).
