"""Filesystem helpers for uploaded originals and generated annotated images.

Only filenames (never full/absolute paths, and never anything derived
directly from user input) are stored in the database or returned to
clients — routes resolve a filename to a real path only inside the
configured upload/result directories, which rules out path traversal.
"""
from __future__ import annotations

import logging
import uuid
from pathlib import Path

from app.config import settings

logger = logging.getLogger("visionai.storage")


def ensure_storage_dirs() -> None:
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    settings.result_path.mkdir(parents=True, exist_ok=True)


def new_stored_filename(analysis_id: str, image_format: str, *, suffix: str = "") -> str:
    """A collision-proof filename for one analysis, e.g. `<id>_original.jpg`."""
    ext = "jpg" if image_format.lower() in ("jpeg", "jpg") else image_format.lower()
    return f"{analysis_id}{suffix}.{ext}"


def save_bytes(directory: Path, filename: str, data: bytes) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    target = _resolve_within(directory, filename)
    target.write_bytes(data)
    return target


def resolve_upload_path(filename: str) -> Path:
    return _resolve_within(settings.upload_path, filename)


def resolve_result_path(filename: str) -> Path:
    return _resolve_within(settings.result_path, filename)


def _resolve_within(directory: Path, filename: str) -> Path:
    """Join `filename` under `directory`, refusing anything that would
    escape it (`..`, absolute paths, symlink tricks)."""
    candidate = (directory / Path(filename).name).resolve()
    directory_resolved = directory.resolve()
    if directory_resolved not in candidate.parents and candidate != directory_resolved:
        raise ValueError(f"Refusing to resolve path outside of {directory_resolved}: {filename}")
    return candidate


def delete_file_if_exists(path: Path | None) -> None:
    if path is None:
        return
    try:
        if path.exists():
            path.unlink()
    except OSError as exc:  # pragma: no cover - defensive, filesystem race conditions
        logger.warning("Could not delete file %s: %s", path, exc)


def new_analysis_id() -> str:
    return uuid.uuid4().hex
