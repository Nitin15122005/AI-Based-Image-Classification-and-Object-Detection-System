from fastapi import APIRouter

from app.schemas import MetricsResponse, ModelsResponse
from app.services.metrics_service import get_metrics, get_models_info

router = APIRouter(tags=["models"])


@router.get("/models", response_model=ModelsResponse)
def get_models() -> ModelsResponse:
    return ModelsResponse(**get_models_info())


@router.get("/metrics", response_model=MetricsResponse)
def get_model_metrics() -> MetricsResponse:
    return MetricsResponse(**get_metrics())
