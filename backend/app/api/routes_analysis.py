import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas import AnalysisResponse
from app.services.analysis_service import AnalysisSettings, analyze_upload
from app.services.history_service import get_analysis
from app.utils.storage import resolve_result_path, resolve_upload_path
from app.utils.validation import validate_and_probe_image, validate_upload_metadata, validate_upload_size

logger = logging.getLogger("visionai.analysis")

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_analysis(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(0.25, ge=0.0, le=1.0),
    detection_enabled: bool = Form(True),
    classification_enabled: bool = Form(True),
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """Accepts a multipart image upload, runs the (mock or real) inference
    pipeline, persists the analysis + detections, and returns the full
    structured result."""
    validate_upload_metadata(file)
    data = file.file.read()
    validate_upload_size(len(data), settings.max_upload_bytes)
    image_info = validate_and_probe_image(data)

    logger.info("analysis started: filename=%s size=%d bytes", file.filename, len(data))

    try:
        analysis = analyze_upload(
            db,
            filename=file.filename,
            data=data,
            image_info=image_info,
            settings_used=AnalysisSettings(
                confidence_threshold=confidence_threshold,
                detection_enabled=detection_enabled,
                classification_enabled=classification_enabled,
            ),
        )
    except Exception:
        logger.exception("analysis failed for filename=%s", file.filename)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Inference failed while analyzing this image. Please try again.",
        )

    logger.info(
        "analysis completed: id=%s objects=%d processing_time=%.3fs",
        analysis.id,
        analysis.objects_detected,
        analysis.processing_time,
    )
    return AnalysisResponse.from_orm_analysis(analysis)


def _get_analysis_or_404(db: Session, analysis_id: str):
    analysis = get_analysis(db, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No analysis found with id '{analysis_id}'.")
    return analysis


@router.get("/results/{analysis_id}/json", response_model=AnalysisResponse)
def get_result_json(analysis_id: str, db: Session = Depends(get_db)) -> AnalysisResponse:
    analysis = _get_analysis_or_404(db, analysis_id)
    return AnalysisResponse.from_orm_analysis(analysis)


@router.get("/results/{analysis_id}/original-image")
def get_original_image(analysis_id: str, db: Session = Depends(get_db)) -> FileResponse:
    analysis = _get_analysis_or_404(db, analysis_id)
    path = resolve_upload_path(analysis.original_image_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Original image file is missing.")
    return FileResponse(path, media_type=f"image/{analysis.image_format}")


@router.get("/results/{analysis_id}/annotated-image")
def get_annotated_image(analysis_id: str, db: Session = Depends(get_db)) -> FileResponse:
    analysis = _get_analysis_or_404(db, analysis_id)
    if not analysis.annotated_image_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annotated image was not generated.")
    path = resolve_result_path(analysis.annotated_image_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annotated image file is missing.")
    return FileResponse(path, media_type="image/jpeg")
