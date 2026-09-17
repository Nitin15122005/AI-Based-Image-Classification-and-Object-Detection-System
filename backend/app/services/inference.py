"""Inference orchestration: adapter selection + the real detect→classify
pipeline stub.

Routes only ever call `run_inference()`. They never know — and must never
need to know — whether `settings.model_mode` is "mock" or "real". Swapping
in real weights later means finishing `RealInferenceAdapter` and flipping
`MODEL_MODE`; nothing in `app/api/*` changes.
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from PIL.Image import Image

from app.config import settings
from app.services.mock_inference import MockInferenceAdapter
from app.services.model_adapter import ClassificationResult, MergedDetection, ModelAdapter

logger = logging.getLogger("visionai.inference")


class RealInferenceAdapter(ModelAdapter):
    """Placeholder for the trained YOLO11s + ResNet50 pipeline.

    Intentionally unimplemented until `ml/models/best_detection.pt` and
    `best_classifier.pth` exist (see project-brain/03_ML_BACKEND.md). When
    that training is complete:

      1. Copy the two weight files to the paths configured by
         DETECTION_MODEL_PATH / CLASSIFICATION_MODEL_PATH.
      2. Set MODEL_MODE=real.
      3. Implement `load()` (load YOLO + ResNet weights), `detect()`
         (YOLO forward pass -> RawDetection list), and `classify()`
         (ResNet forward pass on one crop -> ClassificationResult).
      4. `predict()` can reuse the same detect-then-crop-then-classify
         shape as MockInferenceAdapter.predict().

    No route, schema, or database table changes are required.
    """

    detection_model_name = "YOLO11s"
    classification_model_name = "ResNet50"

    def __init__(self, detection_model_path: str, classification_model_path: str) -> None:
        self.detection_model_path = Path(detection_model_path)
        self.classification_model_path = Path(classification_model_path)
        self._loaded = False

    def load(self) -> None:
        if not self.detection_model_path.exists() or not self.classification_model_path.exists():
            logger.warning(
                "Real model weights not found (detection=%s exists=%s, classification=%s exists=%s). "
                "RealInferenceAdapter will remain unavailable until both are present.",
                self.detection_model_path,
                self.detection_model_path.exists(),
                self.classification_model_path,
                self.classification_model_path.exists(),
            )
            return
        raise NotImplementedError(
            "RealInferenceAdapter.load() is not implemented yet. Train and export "
            "best_detection.pt / best_classifier.pth, then implement this adapter."
        )

    def is_ready(self) -> bool:
        return self._loaded

    def detect(self, image: Image, *, confidence_threshold: float) -> list:
        raise NotImplementedError("RealInferenceAdapter.detect() is not implemented yet.")

    def classify(self, crop: Image) -> ClassificationResult:
        raise NotImplementedError("RealInferenceAdapter.classify() is not implemented yet.")

    def predict(self, image: Image, *, confidence_threshold: float) -> list[MergedDetection]:
        raise NotImplementedError(
            "RealInferenceAdapter.predict() is not implemented yet. Set MODEL_MODE=mock "
            "until training is complete."
        )


@lru_cache
def get_adapter() -> ModelAdapter:
    """The process-wide inference adapter, selected once from configuration
    and loaded eagerly so failures surface at startup, not mid-request."""
    if settings.model_mode == "real":
        adapter: ModelAdapter = RealInferenceAdapter(
            settings.detection_model_path, settings.classification_model_path
        )
    else:
        adapter = MockInferenceAdapter()
    adapter.load()
    return adapter


@dataclass
class InferenceResult:
    detections: list[MergedDetection]
    processing_time_seconds: float
    detection_model_name: str
    classification_model_name: str


def run_inference(
    image: Image,
    *,
    confidence_threshold: float = 0.25,
    detection_enabled: bool = True,
) -> InferenceResult:
    """Runs the configured adapter's full detect+classify pipeline.

    `detection_enabled=False` skips detection entirely (used by the
    Analyze page's "YOLO11s Object Detection" toggle) and returns no
    detections without invoking the adapter at all.
    """
    adapter = get_adapter()
    started_at = time.perf_counter()

    detections: list[MergedDetection] = []
    if detection_enabled:
        detections = adapter.predict(image, confidence_threshold=confidence_threshold)

    elapsed = time.perf_counter() - started_at
    logger.info(
        "inference complete: mode=%s detections=%d elapsed=%.3fs",
        settings.model_mode,
        len(detections),
        elapsed,
    )

    return InferenceResult(
        detections=detections,
        processing_time_seconds=elapsed,
        detection_model_name=adapter.detection_model_name,
        classification_model_name=adapter.classification_model_name,
    )
