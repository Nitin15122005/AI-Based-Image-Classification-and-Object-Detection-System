# VisionAI Backend

FastAPI backend for the AI-Based Image Classification and Object Detection
System. Implements the full API surface the React frontend needs
(upload, analyze, history, models, metrics) against real PostgreSQL
persistence, with production inference served by a pretrained Ultralytics
YOLO11s (COCO) detector and a fine-tuned ResNet50 classifier — see
[Inference architecture](#inference-architecture). A deterministic mock
adapter is also available (`MODEL_MODE=mock`) for frontend-only development
or environments without the PyTorch/CUDA stack installed; the two adapters
share one interface, so routes, schemas, and the database never change
based on which is active.

## Tech stack

Python 3.11+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.x, PostgreSQL
(psycopg3 driver), Alembic, Pillow, pytest + httpx.

## Prerequisites

- Python 3.11+ (3.14 currently lacks prebuilt wheels for some dependencies —
  use 3.11–3.13)
- A PostgreSQL 13+ server (local install, or a hosted Neon database)

## Local setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then edit DATABASE_URL etc.
```

### Database

Create a role and two databases (dev + test) — adjust names/passwords to
match your `.env`:

```sql
CREATE ROLE visionai WITH LOGIN PASSWORD 'visionai_dev_pw';
CREATE DATABASE visionai OWNER visionai;
CREATE DATABASE visionai_test OWNER visionai;   -- used only by pytest
```

Apply migrations:

```bash
alembic upgrade head
```

Also apply them to the test database before running pytest (see Testing
below) — either point `DATABASE_URL` at it temporarily, or run:

```bash
# Windows (Git Bash) / macOS / Linux
DATABASE_URL="postgresql+psycopg://visionai:visionai_dev_pw@127.0.0.1:5432/visionai_test" alembic upgrade head
```

### Run the API

```bash
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/api/v1/health

### Run tests

```bash
pytest -v
```

Tests use their own isolated database (`visionai_test` per `.env`/`DATABASE_URL`
in `tests/conftest.py`) and temp directories for uploaded/annotated images —
they never touch your dev database or require YOLO/ResNet weights.

## Common Alembic commands

```bash
alembic upgrade head                 # apply all pending migrations
alembic downgrade -1                 # roll back one migration
alembic revision --autogenerate -m "message"   # generate a new migration from model changes
alembic current                      # show the currently applied revision
alembic history                      # list all migrations
```

## Configuration

All configuration is environment-driven (see `.env.example`). Nothing is
hardcoded — the same code runs against a local Postgres instance, a hosted
Neon database, or a CI test database purely via `DATABASE_URL`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg://user:pass@host:5432/db` (Neon: append `?sslmode=require`) |
| `UPLOAD_DIR` / `RESULT_DIR` | Where original/annotated images are stored on disk |
| `MAX_UPLOAD_MB` | Upload size limit |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `MODEL_MODE` | `real` (default, production) or `mock` (dev/testing without weights) |
| `DETECTION_MODEL_PATH` / `CLASSIFICATION_MODEL_PATH` | Paths to the production weights (only read when `MODEL_MODE=real`) — default to the pretrained `yolo11s.pt` and the fine-tuned `ml_outputs/models/classification/best_classifier.pth` |

## API overview

All routes are prefixed with `API_PREFIX` (default `/api/v1`).

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness + real DB connectivity check |
| POST | `/analyze` | Multipart image upload → runs inference → persists → returns full result |
| GET | `/history` | Paginated list, with `search`, `status`, `sort` query params |
| GET | `/history/{id}` | Full analysis detail |
| DELETE | `/history/{id}` | Deletes the DB row (detections cascade) and both image files |
| POST | `/history/{id}/rerun` | Re-runs inference on the same original image as a new analysis |
| GET | `/results/{id}/original-image` | Serves the original uploaded image |
| GET | `/results/{id}/annotated-image` | Serves the Pillow-rendered annotated image |
| GET | `/results/{id}/json` | Same payload as `/analyze`/`/history/{id}` |
| GET | `/models` | YOLO11s/ResNet50 metadata (name, architecture, class count, mode, status) |
| GET | `/metrics` | Real detection/classification metrics, training curves, confusion matrix, per-class table, read live from `ml_outputs/` |

## Database schema

Two tables, `analyses` (one row per analysis run) and `detections` (one row
per detected object, `ON DELETE CASCADE` to its analysis). See
`app/models.py` for the full column list. Nested/variable-shape data
(bounding boxes, top-K classifications) lives in `JSONB` columns.

## Inference architecture

`app/services/model_adapter.py` defines the `ModelAdapter` interface
(`load()`, `detect()`, `classify()`, `predict()`) that both
`MockInferenceAdapter` (`mock_inference.py`) and `RealInferenceAdapter`
(`inference.py`) implement. Routes only ever call
`inference.run_inference()` — they never check `MODEL_MODE` or import a
specific adapter, so mock and real inference are interchangeable without
touching `app/api/*`, `app/schemas.py`, or the database schema.

`RealInferenceAdapter` (the `MODEL_MODE=real` default) loads both models
once at startup via an `@lru_cache`d singleton, runs on CUDA when available
with automatic CPU fallback, and reproduces the training notebook's exact
pipeline: YOLO11s detects at `imgsz=640` with a fixed NMS IoU of `0.45` and
a caller-supplied confidence threshold, each detection's box is clipped and
cropped from the *original* image, and the crop is classified by ResNet50
after a `Resize((224,224))` → `ToTensor()` → ImageNet-normalize transform.
Detection and classification results are combined but never overwrite one
another, even when they disagree. `load()` raises if either checkpoint's
class list doesn't exactly match the canonical 80-class COCO order, so a
mismatched model fails at startup rather than serving silently wrong labels.

### Production vs. experimental model artifacts

- **Production detector** — the official pretrained Ultralytics YOLO11s
  COCO checkpoint (`DETECTION_MODEL_PATH`, `yolo11s.pt` at the repo root).
  Ultralytics auto-downloads this file on first load if it isn't already
  present, so it doesn't need to be committed or manually copied.
- **Production classifier** — the project's fine-tuned ResNet50
  (`CLASSIFICATION_MODEL_PATH`, `ml_outputs/models/classification/best_classifier.pth`,
  epoch 15, val accuracy 0.7304). This one *is* project-specific and must be
  produced by the training notebook or copied in manually — `load()` raises
  a clear `FileNotFoundError` if it's missing.
- **Not used in production** — a fine-tuned YOLO11s detector also exists at
  `ml_outputs/models/detection/best_detection.pt` from an earlier
  experiment. It measured lower than the pretrained baseline
  (mAP50-95 0.418 vs. 0.464 after 13 epochs on a 12k-image subset — see
  `ml_outputs/outputs/metrics/detection_baseline_delta.json`), so the
  pretrained checkpoint above is what actually serves requests; the
  fine-tuned run is kept only as a labeled comparison in `GET /metrics`'s
  `detection_experiment` field, never as the production number.

Both `.pt`/`.pth` paths are gitignored — see
[Model artifact handling](#model-artifact-handling) in the root README for
the full picture of what a fresh clone needs to provide.

## Mock mode

Set `MODEL_MODE=mock` to run without any model weights or GPU — useful for
frontend-only development or CI. `MockInferenceAdapter` returns
deterministic, realistic COCO-class detections (same image → same result;
see `app/services/mock_inference.py`), and annotated images are still real
Pillow-drawn artifacts, not placeholders. `GET /metrics` always returns the
real evaluation numbers read from `ml_outputs/` regardless of `MODEL_MODE`,
since those describe the offline evaluation of the models, not the live
serving mode — only the `is_mock`/`note` fields on the analyze/metrics
responses reflect which adapter is currently live. Uploads, validation,
database persistence, history, delete, and rerun are identical in both
modes.
