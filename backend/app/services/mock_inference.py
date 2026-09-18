"""Deterministic mock implementation of ModelAdapter.

No model weights, no randomness — the same image always produces the same
detections, which makes the mock testable and demo-safe. It exists purely
so the rest of the system (API, database, annotated-image rendering,
frontend) can be built and exercised end-to-end before YOLO11s/ResNet50
weights exist. See RealInferenceAdapter in `inference.py` for where the
real models will plug in behind the same interface.
"""
from __future__ import annotations

import zlib

from PIL.Image import Image

from app.services.model_adapter import (
    BoundingBox,
    ClassificationPrediction,
    ClassificationResult,
    MergedDetection,
    ModelAdapter,
    RawDetection,
)
from app.utils.coco_classes import COCO_CLASSES

# Each template is a small, plausible scene: (class_name, confidence, x1, y1, x2, y2)
# as fractions of image width/height, in [0, 1]. Chosen to mirror the
# frontend's mock scenes (see frontend/src/data/mockData.js) for a
# consistent demo story across the whole stack.
_DetectionTemplate = tuple[str, float, float, float, float, float]

_TEMPLATES: list[list[_DetectionTemplate]] = [
    # Street scene: pedestrians, a taxi, a cyclist
    [
        ("person", 0.962, 0.02, 0.53, 0.09, 0.94),
        ("car", 0.947, 0.76, 0.56, 0.99, 0.80),
        ("bicycle", 0.913, 0.56, 0.52, 0.64, 0.89),
        ("person", 0.894, 0.06, 0.59, 0.13, 0.92),
        ("backpack", 0.885, 0.59, 0.58, 0.64, 0.68),
        ("person", 0.871, 0.23, 0.58, 0.29, 0.83),
        ("car", 0.842, 0.46, 0.55, 0.51, 0.61),
    ],
    # Office workspace: laptop, chair, cup, keyboard, plant
    [
        ("laptop", 0.958, 0.30, 0.42, 0.56, 0.64),
        ("chair", 0.905, 0.06, 0.38, 0.24, 0.86),
        ("cup", 0.881, 0.62, 0.55, 0.71, 0.69),
        ("keyboard", 0.867, 0.34, 0.66, 0.54, 0.76),
        ("potted plant", 0.833, 0.80, 0.20, 0.95, 0.60),
    ],
    # Park scene: dog, person, frisbee
    [
        ("dog", 0.968, 0.28, 0.44, 0.58, 0.84),
        ("person", 0.941, 0.62, 0.30, 0.80, 0.85),
        ("frisbee", 0.879, 0.48, 0.22, 0.56, 0.30),
    ],
    # Highway traffic: cars, bus, truck, motorcycle
    [
        ("car", 0.978, 0.04, 0.30, 0.16, 0.45),
        ("car", 0.966, 0.20, 0.35, 0.32, 0.50),
        ("car", 0.954, 0.36, 0.40, 0.48, 0.55),
        ("bus", 0.942, 0.52, 0.32, 0.70, 0.58),
        ("truck", 0.930, 0.74, 0.38, 0.90, 0.60),
        ("motorcycle", 0.918, 0.10, 0.60, 0.20, 0.75),
    ],
]

# Refined classification phrasing per COCO class, mirroring the frontend's
# demo copy. Classes without an explicit entry fall back to a generic
# "<Class> / Detected Object" phrase built from the canonical COCO name.
_REFINEMENTS: dict[str, str] = {
    "person": "Pedestrian / Person",
    "car": "Vehicle / Passenger Car",
    "bicycle": "Bicycle / Micro-mobility",
    "backpack": "Accessory / Carrier Luggage",
    "laptop": "Notebook Computer",
    "chair": "Office / Seating Furniture",
    "cup": "Ceramic Mug / Beverage",
    "keyboard": "Computer Peripheral",
    "potted plant": "Indoor Plant / Greenery",
    "dog": "Domestic Dog",
    "frisbee": "Flying Disc / Toy",
    "bus": "Public Transit Bus",
    "truck": "Heavy Goods Truck",
    "motorcycle": "Motorcycle / Two-Wheeler",
}

_DISTRACTOR_CLASSES = ["person", "car", "chair", "bottle", "backpack"]


def _refined_label(class_name: str) -> str:
    return _REFINEMENTS.get(class_name, f"{class_name.title()} / Detected Object")


def _stable_seed(image: Image) -> int:
    """A CRC32 over image size + a handful of sampled pixels. Deterministic
    across runs/processes (unlike Python's salted hash() for str/bytes),
    so the same image always maps to the same template."""
    width, height = image.size
    rgb = image.convert("RGB")
    sample_points = [
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
        (width // 2, height // 2),
    ]
    blob = bytearray()
    blob += width.to_bytes(4, "little")
    blob += height.to_bytes(4, "little")
    for x, y in sample_points:
        blob += bytes(rgb.getpixel((x, y)))
    return zlib.crc32(bytes(blob))


class MockInferenceAdapter(ModelAdapter):
    detection_model_name = "YOLO11s (mock)"
    classification_model_name = "ResNet50 (mock)"

    def __init__(self) -> None:
        self._loaded = False
        self._current_hint: str | None = None

    @property
    def device_description(self) -> str:
        return "CPU (mock — no model weights loaded)"

    def load(self) -> None:
        self._loaded = True

    def is_ready(self) -> bool:
        return self._loaded

    def detect(self, image: Image, *, confidence_threshold: float) -> list[RawDetection]:
        width, height = image.size
        template = _TEMPLATES[_stable_seed(image) % len(_TEMPLATES)]

        detections: list[RawDetection] = []
        for class_name, confidence, x1f, y1f, x2f, y2f in template:
            if confidence < confidence_threshold:
                continue
            bbox = BoundingBox(
                x1=round(x1f * width, 1),
                y1=round(y1f * height, 1),
                x2=round(min(x2f * width, width - 1), 1),
                y2=round(min(y2f * height, height - 1), 1),
            )
            detections.append(RawDetection(class_name=class_name, confidence=confidence, bbox=bbox))
        return detections

    def classify(self, crop: Image) -> ClassificationResult:
        hint = self._current_hint
        if hint is None:
            # Standalone call with no detection context: derive something
            # deterministic (but plausible) from the crop itself.
            index = _stable_seed(crop) % len(COCO_CLASSES)
            hint = COCO_CLASSES[index]

        top1_confidence = 0.90 + (_stable_seed(crop) % 90) / 1000  # 0.900-0.989, deterministic
        top1 = ClassificationPrediction(class_name=_refined_label(hint), confidence=round(top1_confidence, 4))

        remainder = 1 - top1.confidence
        distractors = [c for c in _DISTRACTOR_CLASSES if c != hint][:3]
        weights = [0.5, 0.3, 0.2][: len(distractors)]
        top_k = [top1]
        for distractor, weight in zip(distractors, weights):
            top_k.append(
                ClassificationPrediction(class_name=_refined_label(distractor), confidence=round(remainder * weight, 4))
            )

        return ClassificationResult(top1=top1, top_k=top_k)

    def predict(self, image: Image, *, confidence_threshold: float) -> list[MergedDetection]:
        raw_detections = self.detect(image, confidence_threshold=confidence_threshold)
        width, height = image.size

        merged: list[MergedDetection] = []
        for raw in raw_detections:
            x1 = max(0, int(raw.bbox.x1))
            y1 = max(0, int(raw.bbox.y1))
            x2 = min(width, max(x1 + 1, int(raw.bbox.x2)))
            y2 = min(height, max(y1 + 1, int(raw.bbox.y2)))
            crop = image.crop((x1, y1, x2, y2))

            self._current_hint = raw.class_name
            try:
                classification = self.classify(crop)
            finally:
                self._current_hint = None

            merged.append(
                MergedDetection(
                    class_name=raw.class_name,
                    confidence=raw.confidence,
                    bbox=raw.bbox,
                    classification=classification,
                )
            )
        return merged
