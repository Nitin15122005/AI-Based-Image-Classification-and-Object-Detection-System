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

    cors_origins: str = "http://localhost:5173"

    model_mode: str = "mock"  # "mock" or "real"
    detection_model_path: str = "./ml_models/best_detection.pt"
    classification_model_path: str = "./ml_models/best_classifier.pth"

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


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance.

    Tests that need different configuration (test database, temp storage
    dirs) must set the relevant environment variables *before* this is
    first called, then call `get_settings.cache_clear()`.
    """
    return Settings()


settings = get_settings()
