"""Environment-driven application settings.

Everything here comes from environment variables (loaded from `.env` in
local development). Nothing is hardcoded, so the same code runs against a
local PostgreSQL instance, a Neon database, or CI's test database purely by
changing the environment.
"""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "VisionAI API"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg://visionai:visionai_dev_pw@127.0.0.1:5432/visionai"

    upload_dir: str = "./storage/uploads"
    result_dir: str = "./storage/results"
    max_upload_mb: int = 25

    # Comma-separated list; covers both localhost/127.0.0.1 and the ports Vite
    # falls back to when 5173 is already taken. Overridable via CORS_ORIGINS.
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"

    model_mode: str = "real"  # "real" (production) or "mock" (dev/testing without weights)
    # Production detector = the official pretrained Ultralytics YOLO11s COCO
    # checkpoint, NOT the fine-tuned ml_outputs/models/detection/best_detection.pt
    # — the training notebook's own baseline comparison showed the pretrained
    # weights outperform the fine-tuned ones (see
    # ml_outputs/outputs/metrics/detection_baseline_delta.json).
    detection_model_path: str = "../yolo11s.pt"
    classification_model_path: str = "../ml_outputs/models/classification/best_classifier.pth"
    # Where the notebook's real evaluation artifacts (metrics JSON/CSV) live,
    # read by metrics_service.py. Never written to by the API.
    ml_outputs_dir: str = "../ml_outputs"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def upload_path(self) -> Path:
        return Path(self.upload_dir).resolve()

    @property
    def result_path(self) -> Path:
        return Path(self.result_dir).resolve()

    @property
    def ml_outputs_path(self) -> Path:
        return Path(self.ml_outputs_dir).resolve()


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance.

    Tests that need different configuration (test database, temp storage
    dirs) must set the relevant environment variables *before* this is
    first called, then call `get_settings.cache_clear()`.
    """
    return Settings()


settings = get_settings()
