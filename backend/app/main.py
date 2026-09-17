"""FastAPI application entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import routes_analysis, routes_health, routes_history, routes_models
from app.config import settings
from app.services.inference import get_adapter
from app.utils.storage import ensure_storage_dirs

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("visionai")


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_storage_dirs()
    logger.info(
        "startup: app=%s version=%s model_mode=%s database=%s",
        settings.app_name,
        settings.app_version,
        settings.model_mode,
        settings.database_url.split("@")[-1],  # never log credentials
    )
    adapter = get_adapter()
    logger.info("inference adapter ready: %s (ready=%s)", type(adapter).__name__, adapter.is_ready())
    yield
    logger.info("shutdown: %s", settings.app_name)


app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catches anything that slips past route-level handling. Logs the
    real exception server-side; the client only ever sees a generic
    message, never a stack trace."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please try again later."},
    )


app.include_router(routes_health.router, prefix=settings.api_prefix)
app.include_router(routes_analysis.router, prefix=settings.api_prefix)
app.include_router(routes_history.router, prefix=settings.api_prefix)
app.include_router(routes_models.router, prefix=settings.api_prefix)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"service": settings.app_name, "docs": "/docs", "health": f"{settings.api_prefix}/health"}
