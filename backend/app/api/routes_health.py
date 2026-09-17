import logging

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas import HealthResponse

logger = logging.getLogger("visionai.health")

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    """Liveness/readiness check. Actually queries PostgreSQL rather than
    assuming it's up — this is what the frontend's "backend unavailable"
    state polls."""
    try:
        db.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        logger.exception("Database health check failed")
        database_status = "unavailable"

    return HealthResponse(
        status="healthy" if database_status == "connected" else "degraded",
        service=settings.app_name,
        version=settings.app_version,
        database=database_status,
        inference_mode=settings.model_mode,
    )
