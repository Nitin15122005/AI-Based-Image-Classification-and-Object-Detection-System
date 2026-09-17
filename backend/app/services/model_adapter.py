"""The stable interface every inference backend (mock or real) implements.

`app/api/*` and `app/services/inference.py`'s orchestration only ever talk
to a `ModelAdapter`. They never check `settings.model_mode` themselves and
never import `MockInferenceAdapter`/`RealInferenceAdapter` directly — that
selection happens once, in `inference.get_adapter()`. This is what lets the
real YOLO11s/ResNet50 models replace the mock later without touching a
single route or schema.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from PIL.Image import Image


@dataclass
class BoundingBox:
    x1: float
    y1: float
    x2: float
    y2: float


@dataclass
class RawDetection:
    """One detected object, as produced by the detection model — before
    classification has been attached."""

    class_name: str
    confidence: float
    bbox: BoundingBox


@dataclass
class ClassificationPrediction:
    class_name: str
    confidence: float


@dataclass
class ClassificationResult:
    top1: ClassificationPrediction
    top_k: list[ClassificationPrediction] = field(default_factory=list)


@dataclass
class MergedDetection:
    """One detected object with its classification attached — the unit
    `predict()` returns, and what `inference.run_inference()` persists."""

    class_name: str
    confidence: float
    bbox: BoundingBox
    classification: ClassificationResult


class ModelAdapter(ABC):
    """Common interface for both the mock and real inference backends."""

    #: Human-readable model names surfaced via GET /api/v1/models and in
    #: each analysis's `models` field.
    detection_model_name: str = "YOLO11s"
    classification_model_name: str = "ResNet50"

    @abstractmethod
    def load(self) -> None:
        """Load model weights (or, for the mock adapter, do nothing).
        Called once at process startup."""

    @abstractmethod
    def detect(self, image: Image, *, confidence_threshold: float) -> list[RawDetection]:
        """Run object detection on the full image, filtered to detections
        at or above `confidence_threshold`."""

    @abstractmethod
    def classify(self, crop: Image) -> ClassificationResult:
        """Run classification on a single cropped detection region."""

    @abstractmethod
    def predict(self, image: Image, *, confidence_threshold: float) -> list[MergedDetection]:
        """End-to-end: detect objects, classify each crop, and merge the
        two into one list. This is what `inference.run_inference()` calls;
        `detect()`/`classify()` stay available individually for direct use
        and testing."""

    def is_ready(self) -> bool:
        """Whether this adapter can actually serve predictions right now
        (e.g. real weights found on disk). Mock is always ready."""
        return True
