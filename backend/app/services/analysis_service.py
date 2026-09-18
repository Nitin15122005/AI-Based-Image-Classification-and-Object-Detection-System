"""End-to-end analysis orchestration shared by the `/analyze` and
`/history/{id}/rerun` routes: run inference, render the annotated image,
and persist everything as one `Analysis` + its `Detection` rows.

Keeping this in one place (instead of duplicating it across two route
handlers) mirrors the frontend's shared `runMockInference()` helper in
`frontend/src/services/api.js`.
"""
from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models import Analysis, Detection
from app.services import image_service
from app.services.inference import run_inference
from app.services.model_adapter import MergedDetection
from app.utils.storage import new_analysis_id, resolve_upload_path
from app.utils.validation import ImageInfo


@dataclass
class AnalysisSettings:
    confidence_threshold: float = 0.25
    detection_enabled: bool = True
    classification_enabled: bool = True


def build_summary(detections: list[MergedDetection], distinct_classes: int) -> str:
    if not detections:
        return (
            "No objects were detected above the current confidence threshold. Try lowering "
            "the threshold or uploading a clearer image."
        )
    top = max(detections, key=lambda d: d.confidence)
    plural = "s" if len(detections) != 1 else ""
    was_were = "were" if len(detections) != 1 else "was"
    class_plural = "es" if distinct_classes != 1 else ""
    return (
        f"{len(detections)} object{plural} {was_were} detected across {distinct_classes} distinct "
        f"class{class_plural}. The highest-confidence detection was {top.class_name} at "
        f"{top.confidence * 100:.1f}%."
    )


def build_top_classifications(detections: list[MergedDetection], limit: int = 5) -> list[dict]:
    """Best classification per distinct class, across all detections,
    sorted by confidence and capped at `limit`."""
    best_by_class: dict[str, float] = {}
    for detection in detections:
        top1 = detection.classification.top1
        if top1.class_name not in best_by_class or top1.confidence > best_by_class[top1.class_name]:
            best_by_class[top1.class_name] = top1.confidence

    ranked = sorted(best_by_class.items(), key=lambda item: item[1], reverse=True)
    return [{"class_name": name, "confidence": confidence} for name, confidence in ranked[:limit]]


def _persist_new_analysis(
    db: Session,
    *,
    analysis_id: str,
    filename: str,
    original_filename: str,
    image_info: ImageInfo,
    file_size_bytes: int,
    settings_used: AnalysisSettings,
) -> Analysis:
    original_path = resolve_upload_path(original_filename)
    image = image_service.open_image_for_inference(original_path)

    inference_result = run_inference(
        image,
        confidence_threshold=settings_used.confidence_threshold,
        detection_enabled=settings_used.detection_enabled,
    )

    annotated_filename = image_service.render_annotated_image(
        analysis_id, original_filename, image_info.format, inference_result.detections
    )

    detections = inference_result.detections
    avg_confidence = sum(d.confidence for d in detections) / len(detections) if detections else 0.0
    distinct_classes = len({d.class_name for d in detections})
    top_classifications = (
        build_top_classifications(detections) if settings_used.classification_enabled else []
    )

    analysis = Analysis(
        id=analysis_id,
        filename=filename,
        original_image_path=original_filename,
        annotated_image_path=annotated_filename,
        status="completed",
        processing_time=round(inference_result.processing_time_seconds, 3),
        width=image_info.width,
        height=image_info.height,
        file_size_bytes=file_size_bytes,
        image_format=image_info.format,
        objects_detected=len(detections),
        average_confidence=round(avg_confidence, 4),
        detection_model_name=inference_result.detection_model_name,
        classification_model_name=inference_result.classification_model_name,
        confidence_threshold=settings_used.confidence_threshold,
        detection_enabled=settings_used.detection_enabled,
        classification_enabled=settings_used.classification_enabled,
        top_classifications=top_classifications,
        summary=build_summary(detections, distinct_classes),
    )
    analysis.detections = [
        Detection(
            class_name=d.class_name,
            detection_confidence=d.confidence,
            bbox={"x1": d.bbox.x1, "y1": d.bbox.y1, "x2": d.bbox.x2, "y2": d.bbox.y2},
            classification_class_name=d.classification.top1.class_name,
            classification_confidence=d.classification.top1.confidence,
        )
        for d in detections
    ]

    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def analyze_upload(
    db: Session,
    *,
    filename: str,
    data: bytes,
    image_info: ImageInfo,
    settings_used: AnalysisSettings,
) -> Analysis:
    """Handles a fresh multipart upload: save the bytes under a new
    analysis id, run the shared persistence pipeline."""
    analysis_id = new_analysis_id()
    original_filename = image_service.save_original(analysis_id, image_info.format, data)
    return _persist_new_analysis(
        db,
        analysis_id=analysis_id,
        filename=filename,
        original_filename=original_filename,
        image_info=image_info,
        file_size_bytes=len(data),
        settings_used=settings_used,
    )


def rerun_analysis(db: Session, *, source: Analysis, settings_used: AnalysisSettings | None = None) -> Analysis:
    """Re-runs inference against the same original image, saved as an
    independent copy under a new id so deleting either analysis never
    breaks the other."""
    original_bytes = image_service.read_original_bytes(source.original_image_path)
    image_info = ImageInfo(width=source.width, height=source.height, format=source.image_format)
    resolved_settings = settings_used or AnalysisSettings(
        confidence_threshold=source.confidence_threshold,
        detection_enabled=source.detection_enabled,
        classification_enabled=source.classification_enabled,
    )

    analysis_id = new_analysis_id()
    original_filename = image_service.save_original(analysis_id, image_info.format, original_bytes)
    return _persist_new_analysis(
        db,
        analysis_id=analysis_id,
        filename=source.filename,
        original_filename=original_filename,
        image_info=image_info,
        file_size_bytes=len(original_bytes),
        settings_used=resolved_settings,
    )


__all__ = ["AnalysisSettings", "analyze_upload", "rerun_analysis", "build_summary", "build_top_classifications"]
