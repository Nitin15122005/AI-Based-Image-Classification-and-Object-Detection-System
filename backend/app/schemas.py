"""Pydantic v2 response models.

These are the API contract the React frontend integrates against (see
`frontend/src/services/api.js`). Field names are intentionally snake_case
to match a conventional REST/Python API; the frontend's real-backend
adapter is responsible for converting to the camelCase shape its
components already expect.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BoundingBoxSchema(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class ClassificationSchema(BaseModel):
    class_name: str
    confidence: float


class DetectionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    class_name: str
    detection_confidence: float
    bbox: BoundingBoxSchema
    classification: ClassificationSchema

    @classmethod
    def from_orm_detection(cls, detection) -> "DetectionSchema":
        return cls(
            id=detection.id,
            class_name=detection.class_name,
            detection_confidence=detection.detection_confidence,
            bbox=BoundingBoxSchema(**detection.bbox),
            classification=ClassificationSchema(
                class_name=detection.classification_class_name,
                confidence=detection.classification_confidence,
            ),
        )


class ModelsUsedSchema(BaseModel):
    detection: str
    classification: str


class TopClassificationSchema(BaseModel):
    class_name: str
    confidence: float


class AnalysisResponse(BaseModel):
    id: str
    filename: str
    created_at: datetime
    processing_time: float
    status: str

    objects_detected: int
    average_confidence: float

    models: ModelsUsedSchema

    original_image_url: str
    annotated_image_url: str | None

    width: int
    height: int
    file_size_bytes: int
    image_format: str

    confidence_threshold: float
    detection_enabled: bool
    classification_enabled: bool

    detections: list[DetectionSchema]
    top_classifications: list[TopClassificationSchema]
    summary: str

    @classmethod
    def from_orm_analysis(cls, analysis) -> "AnalysisResponse":
        return cls(
            id=analysis.id,
            filename=analysis.filename,
            created_at=analysis.created_at,
            processing_time=analysis.processing_time,
            status=analysis.status,
            objects_detected=analysis.objects_detected,
            average_confidence=analysis.average_confidence,
            models=ModelsUsedSchema(
                detection=analysis.detection_model_name, classification=analysis.classification_model_name
            ),
            original_image_url=f"/api/v1/results/{analysis.id}/original-image",
            annotated_image_url=(
                f"/api/v1/results/{analysis.id}/annotated-image" if analysis.annotated_image_path else None
            ),
            width=analysis.width,
            height=analysis.height,
            file_size_bytes=analysis.file_size_bytes,
            image_format=analysis.image_format,
            confidence_threshold=analysis.confidence_threshold,
            detection_enabled=analysis.detection_enabled,
            classification_enabled=analysis.classification_enabled,
            detections=[DetectionSchema.from_orm_detection(d) for d in analysis.detections],
            top_classifications=[
                TopClassificationSchema(**item) for item in (analysis.top_classifications or [])
            ],
            summary=analysis.summary or "",
        )


class HistoryItemResponse(BaseModel):
    id: str
    filename: str
    created_at: datetime
    status: str
    objects_detected: int
    average_confidence: float
    processing_time: float
    width: int
    height: int
    thumbnail_url: str

    @classmethod
    def from_orm_analysis(cls, analysis) -> "HistoryItemResponse":
        return cls(
            id=analysis.id,
            filename=analysis.filename,
            created_at=analysis.created_at,
            status=analysis.status,
            objects_detected=analysis.objects_detected,
            average_confidence=analysis.average_confidence,
            processing_time=analysis.processing_time,
            width=analysis.width,
            height=analysis.height,
            thumbnail_url=f"/api/v1/results/{analysis.id}/original-image",
        )


class HistoryListResponse(BaseModel):
    items: list[HistoryItemResponse]
    total: int
    page: int
    page_size: int


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str
    inference_mode: str


class ModelDetailSchema(BaseModel):
    name: str
    purpose: str
    architecture: str
    framework: str
    class_count: int
    mode: str
    status: str
    weights_path: str


class ModelsResponse(BaseModel):
    mode: str
    detection: ModelDetailSchema
    classification: ModelDetailSchema


class DetectionMetricsSchema(BaseModel):
    precision: float
    recall: float
    map50: float
    map50_95: float


class DetectionExperimentSchema(BaseModel):
    """The fine-tuned YOLO11s run — a labeled comparison artifact only.
    Never the production detector's metrics (see DetectionMetricsSchema)."""

    description: str
    precision: float
    recall: float
    map50: float
    map50_95: float


class ClassificationMetricsSchema(BaseModel):
    top1_accuracy: float
    top5_accuracy: float
    balanced_accuracy: float
    macro_f1: float
    weighted_f1: float


class DetectionEpochSchema(BaseModel):
    epoch: int
    box_loss: float
    class_loss: float
    map50: float


class ClassificationEpochSchema(BaseModel):
    epoch: int
    train_accuracy: float
    val_accuracy: float
    val_loss: float


class TrainingHistorySchema(BaseModel):
    detection: list[DetectionEpochSchema]
    classification: list[ClassificationEpochSchema]


class ConfusionMatrixSchema(BaseModel):
    classes: list[str]
    matrix: list[list[float]]


class PerClassMetricSchema(BaseModel):
    name: str
    precision: float
    recall: float
    f1: float
    support: int


class DatasetInfoSchema(BaseModel):
    name: str
    num_classes: int
    train_subset: str
    val_subset: str


class DeviceInfoSchema(BaseModel):
    training_hardware: str
    serving_device: str


class MetricsResponse(BaseModel):
    is_mock: bool
    note: str
    detection: DetectionMetricsSchema
    classification: ClassificationMetricsSchema
    training_history: TrainingHistorySchema
    confusion_matrix: ConfusionMatrixSchema
    per_class_metrics: list[PerClassMetricSchema]
    dataset: DatasetInfoSchema
    device: DeviceInfoSchema
    detection_experiment: DetectionExperimentSchema | None = None


class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Human-readable error message safe to show to users.")
