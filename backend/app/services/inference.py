"""Inference orchestration: adapter selection + the production detect→classify
pipeline (pretrained YOLO11s + fine-tuned ResNet50).

Routes only ever call `run_inference()`. They never know — and must never
need to know — whether `settings.model_mode` is "mock" or "real"; that
selection happens once, in `get_adapter()`.
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
from app.services.model_adapter import (
    BoundingBox,
    ClassificationPrediction,
    ClassificationResult,
    MergedDetection,
    ModelAdapter,
    RawDetection,
)
from app.utils.coco_classes import COCO_CLASSES

logger = logging.getLogger("visionai.inference")

# Fixed NMS IoU threshold used for the production detector — matches the
# `predict_image()` reference implementation in coco_detection_classification.ipynb
# (not user-configurable; only the confidence threshold is exposed to callers).
_DETECTION_IOU_THRESHOLD = 0.45
_DETECTION_IMAGE_SIZE = 640
_TOP_K_CLASSIFICATIONS = 5


class RealInferenceAdapter(ModelAdapter):
    """The production pipeline: the official pretrained Ultralytics YOLO11s
    checkpoint for detection, and the fine-tuned ResNet50 checkpoint
    (`best_classifier.pth`) for per-crop classification.

    This intentionally does NOT load the fine-tuned detection checkpoint
    (`ml_outputs/models/detection/best_detection.pt`) — the training
    notebook's own baseline comparison showed the official pretrained
    weights score higher (mAP50-95 0.464 vs 0.418) after only 13 epochs of
    fine-tuning on a 12k-image subset, so the pretrained checkpoint is the
    correct production choice. The fine-tuned checkpoint remains on disk as
    a documented experiment/comparison artifact only (see
    `ml_outputs/outputs/metrics/detection_baseline_delta.json`).

    Detection and classification preprocessing here are reproduced exactly
    from the notebook's `predict_image()`/`classify_crop()` functions and
    `ml_outputs/models/preprocessing_config.json` — resize-to-square 224x224,
    ImageNet mean/std normalization, RGB — so results match what the
    notebook demonstrated.
    """

    detection_model_name = "YOLO11s"
    classification_model_name = "ResNet50"

    def __init__(self, detection_model_path: str, classification_model_path: str) -> None:
        self.detection_model_path = Path(detection_model_path)
        self.classification_model_path = Path(classification_model_path)
        self._detector = None
        self._classifier = None
        self._eval_transform = None
        self._device = None
        self._loaded = False
        self._checkpoint_meta: dict = {}

    def load(self) -> None:
        if not self.detection_model_path.exists():
            raise FileNotFoundError(
                f"Detection weights not found at {self.detection_model_path}. "
                "Set DETECTION_MODEL_PATH to the pretrained yolo11s.pt file."
            )
        if not self.classification_model_path.exists():
            raise FileNotFoundError(
                f"Classification checkpoint not found at {self.classification_model_path}. "
                "Set CLASSIFICATION_MODEL_PATH to best_classifier.pth."
            )

        # Imported lazily so `MODEL_MODE=mock` never requires torch/ultralytics
        # to be installed — the app must start correctly without model weights.
        import torch
        from torchvision import models as tv_models
        from torchvision import transforms as T
        from ultralytics import YOLO

        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info("Loading real inference models on device=%s", self._device)

        detector = YOLO(str(self.detection_model_path))
        detector_names = [detector.names[i] for i in sorted(detector.names)]
        if detector_names != COCO_CLASSES:
            raise RuntimeError(
                "Detection model's class list does not match the canonical 80-class COCO "
                "list in app/utils/coco_classes.py — refusing to serve mismatched predictions."
            )
        self._detector = detector

        checkpoint = torch.load(self.classification_model_path, map_location=self._device, weights_only=False)
        num_classes = checkpoint.get("num_classes")
        if num_classes != len(COCO_CLASSES):
            raise RuntimeError(
                f"Classification checkpoint has {num_classes} output classes, "
                f"expected {len(COCO_CLASSES)}."
            )
        checkpoint_class_names = checkpoint.get("class_names")
        if checkpoint_class_names is not None and checkpoint_class_names != COCO_CLASSES:
            raise RuntimeError("Classification checkpoint's class_names do not match the canonical list.")

        classifier = tv_models.resnet50(weights=None)
        classifier.fc = torch.nn.Linear(classifier.fc.in_features, num_classes)
        classifier.load_state_dict(checkpoint["state_dict"])
        classifier.eval()
        classifier.to(self._device)
        self._classifier = classifier

        normalization = checkpoint.get("normalization", {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]})
        image_size = checkpoint.get("image_size", 224)
        self._eval_transform = T.Compose(
            [
                T.Resize((image_size, image_size)),
                T.ToTensor(),
                T.Normalize(normalization["mean"], normalization["std"]),
            ]
        )
        self._checkpoint_meta = {
            "epoch": checkpoint.get("epoch"),
            "val_accuracy": checkpoint.get("val_accuracy"),
        }
        self._loaded = True
        logger.info(
            "Real inference models loaded: detector=%s (pretrained COCO) classifier=%s "
            "(epoch=%s val_accuracy=%.4f) device=%s",
            self.detection_model_path.name,
            self.classification_model_path.name,
            self._checkpoint_meta["epoch"],
            self._checkpoint_meta["val_accuracy"] or 0.0,
            self._device,
        )

    def is_ready(self) -> bool:
        return self._loaded

    @property
    def device_description(self) -> str:
        if self._device is None:
            return "not loaded"
        if self._device.type == "cuda":
            import torch

            return torch.cuda.get_device_name(0)
        return "CPU"

    def detect(self, image: Image, *, confidence_threshold: float) -> list[RawDetection]:
        import numpy as np

        np_image = np.array(image.convert("RGB"))
        result = self._detector.predict(
            source=np_image,
            imgsz=_DETECTION_IMAGE_SIZE,
            conf=confidence_threshold,
            iou=_DETECTION_IOU_THRESHOLD,
            verbose=False,
        )[0]

        detections: list[RawDetection] = []
        if result.boxes is not None and len(result.boxes) > 0:
            boxes = result.boxes.xyxy.cpu().numpy()
            scores = result.boxes.conf.cpu().numpy()
            classes = result.boxes.cls.cpu().numpy().astype(int)
            for bbox, score, cls_idx in zip(boxes, scores, classes):
                detections.append(
                    RawDetection(
                        class_name=COCO_CLASSES[int(cls_idx)],
                        confidence=float(score),
                        bbox=BoundingBox(x1=float(bbox[0]), y1=float(bbox[1]), x2=float(bbox[2]), y2=float(bbox[3])),
                    )
                )
        return detections

    def classify(self, crop: Image) -> ClassificationResult:
        import torch

        tensor = self._eval_transform(crop.convert("RGB")).unsqueeze(0).to(self._device)
        with torch.no_grad():
            probs = torch.softmax(self._classifier(tensor).float(), dim=1)[0].cpu()

        k = min(_TOP_K_CLASSIFICATIONS, len(COCO_CLASSES))
        values, indices = probs.topk(k)
        top_k = [
            ClassificationPrediction(class_name=COCO_CLASSES[int(idx)], confidence=float(val))
            for val, idx in zip(values, indices)
        ]
        return ClassificationResult(top1=top_k[0], top_k=top_k)

    def predict(self, image: Image, *, confidence_threshold: float) -> list[MergedDetection]:
        width, height = image.size
        raw_detections = self.detect(image, confidence_threshold=confidence_threshold)

        merged: list[MergedDetection] = []
        for raw in raw_detections:
            # Exact clipping formula from the notebook's predict_image().
            x1 = int(max(0, min(width - 1, raw.bbox.x1)))
            y1 = int(max(0, min(height - 1, raw.bbox.y1)))
            x2 = int(max(x1 + 1, min(width, raw.bbox.x2)))
            y2 = int(max(y1 + 1, min(height, raw.bbox.y2)))
            crop = image.crop((x1, y1, x2, y2))

            classification = self.classify(crop)
            merged.append(
                MergedDetection(
                    class_name=raw.class_name,
                    confidence=raw.confidence,
                    bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                    classification=classification,
                )
            )
        return merged


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
