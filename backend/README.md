# VisionAI Backend

FastAPI backend for the AI-Based Image Classification and Object Detection
System capstone. Implements the full API surface the React frontend needs
(upload, analyze, history, models, metrics) against real PostgreSQL
persistence, with inference currently served by a deterministic mock
adapter — see [Inference architecture](#inference-architecture) for how the
real YOLO11s + ResNet50 models plug in later without any API changes.

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
| `MODEL_MODE` | `mock` (default) or `real` |
| `DETECTION_MODEL_PATH` / `CLASSIFICATION_MODEL_PATH` | Paths to trained weights (only read when `MODEL_MODE=real`) |

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
| GET | `/metrics` | Detection/classification metrics, training curves, confusion matrix, per-class table (mock, clearly labeled) |

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
specific adapter, so switching from mock to real inference never touches
`app/api/*`, `app/schemas.py`, or the database schema.

### Bringing in the trained models later

1. Copy the Colab-trained weights to the paths configured by
   `DETECTION_MODEL_PATH` (`best_detection.pt`) and
   `CLASSIFICATION_MODEL_PATH` (`best_classifier.pth`).
2. Set `MODEL_MODE=real` in `.env`.
3. Implement `RealInferenceAdapter.load()/detect()/classify()/predict()` in
   `app/services/inference.py` (currently raises `NotImplementedError`).
4. Replace the mock values in `app/services/metrics_service.py` with the
   notebook's real evaluation output.

No route, schema, or frontend change is required for this swap.

## What's mocked right now

- **Inference**: `MockInferenceAdapter` returns deterministic, realistic
  COCO-class detections (same image → same result) — see
  `app/services/mock_inference.py`. Annotated images are real Pillow-drawn
  artifacts, not placeholders.
- **Metrics** (`GET /metrics`): explicitly marked `"is_mock": true` with a
  `note` field; numbers mirror the frontend's placeholder values for
  consistency across the stack until the Colab notebook produces real ones.

Everything else — uploads, validation, database persistence, history,
delete, rerun, annotated image generation — is real, not mocked.
