"""Shared pytest fixtures.

Critical ordering: environment variables that steer configuration (test
database, temp storage dirs, mock inference) are set at module import time,
*before* anything under `app` is imported — `app.config.settings` is a
module-level singleton read once at import, so this is the only point at
which tests can safely redirect it.
"""
import os
import tempfile
from pathlib import Path

_TEST_STORAGE_ROOT = tempfile.mkdtemp(prefix="visionai_test_storage_")

os.environ["DATABASE_URL"] = "postgresql+psycopg://visionai:visionai_dev_pw@127.0.0.1:5432/visionai_test"
os.environ["UPLOAD_DIR"] = str(Path(_TEST_STORAGE_ROOT) / "uploads")
os.environ["RESULT_DIR"] = str(Path(_TEST_STORAGE_ROOT) / "results")
os.environ["MODEL_MODE"] = "mock"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"
os.environ["MAX_UPLOAD_MB"] = "25"

import io  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402
from sqlalchemy import event  # noqa: E402

from app.database import Base, SessionLocal, engine, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.utils.storage import ensure_storage_dirs  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _prepare_database():
    """Tables already exist from `alembic upgrade head` against
    visionai_test in normal dev use, but `create_all` is idempotent so
    this also works on a completely fresh test database (e.g. in CI)."""
    ensure_storage_dirs()
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def db_session():
    """One test = one outer transaction, rolled back at teardown, with a
    savepoint that's restarted after every `session.commit()` inside
    application code — the standard SQLAlchemy testing recipe so each
    test starts from a clean, isolated database state."""
    connection = engine.connect()
    outer_transaction = connection.begin()
    session = SessionLocal(bind=connection)
    session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, transaction):
        if transaction.nested and not transaction._parent.nested:
            sess.begin_nested()

    try:
        yield session
    finally:
        session.close()
        outer_transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _make_jpeg_bytes(size=(640, 480), color=(120, 160, 200)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, color=color).save(buffer, format="JPEG")
    return buffer.getvalue()


@pytest.fixture()
def sample_image_bytes() -> bytes:
    return _make_jpeg_bytes()


@pytest.fixture()
def sample_upload_file(sample_image_bytes):
    """A ready-to-use `files=` tuple for httpx/TestClient multipart posts."""
    return {"file": ("sample.jpg", sample_image_bytes, "image/jpeg")}
