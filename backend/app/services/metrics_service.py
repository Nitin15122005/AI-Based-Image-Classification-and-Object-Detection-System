"""Model metadata and evaluation metrics for GET /api/v1/models and
GET /api/v1/metrics — read from the real artifacts the training notebook
(`coco_detection_classification.ipynb`) produced under `ml_outputs/`.

Production detector = the official pretrained Ultralytics YOLO11s COCO
checkpoint, so its metrics are the *pretrained baseline* the notebook
measured on this project's held-out val2017 split
(`detection_baseline_metrics.json`) — NOT the fine-tuned checkpoint, which
the notebook's own comparison showed underperforms that baseline
(`detection_baseline_delta.json`). The fine-tuned run is surfaced only as a
labeled experiment/comparison, never as the production number.

Production classifier = the fine-tuned ResNet50 checkpoint, so its metrics
are the real fine-tuned results (`classification_metrics.json`).

Every value here is loaded from disk, not hardcoded — if an artifact is
genuinely missing this raises loudly (see `_load_json`/`_load_csv`) rather
than inventing a number.
"""
from __future__ import annotations

import csv
import json
import logging
from functools import lru_cache
from pathlib import Path

import numpy as np

from app.config import settings
from app.utils.coco_classes import COCO_CLASSES

logger = logging.getLogger("visionai.metrics")

# The 10 classes shown in the compact confusion-matrix view (kept small so
# the grid stays readable — the full 80-class breakdown is in per_class_metrics).
_CONFUSION_MATRIX_CLASSES = [
    "person", "car", "dog", "bicycle", "chair", "laptop", "bottle", "backpack", "traffic light", "bus",
]

_NOTE = (
    "Detection metrics are the official pretrained YOLO11s COCO baseline, measured on this "
    "project's held-out val2017 split — this is the production detector. A fine-tuned YOLO11s "
    "checkpoint was also trained (13 epochs on a 12,000-image subset) but scored lower "
    "(mAP50-95 0.418 vs 0.464) and is kept only as a documented comparison experiment; its "
    "training curve below is that experiment, not the production model's training. "
    "Classification metrics are the fine-tuned ResNet50 checkpoint, which IS the production classifier."
)


def _metrics_dir() -> Path:
    return settings.ml_outputs_path / "outputs" / "metrics"


def _models_dir() -> Path:
    return settings.ml_outputs_path / "models"


def _load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        logger.error("Required metrics artifact missing: %s", path)
        raise


def _load_csv_records(path: Path) -> list[dict]:
    try:
        with path.open(newline="") as handle:
            return list(csv.DictReader(handle))
    except FileNotFoundError:
        logger.error("Required metrics artifact missing: %s", path)
        raise


@lru_cache
def _detection_baseline() -> dict:
    """The pretrained YOLO11s baseline — the production detector's real metrics."""
    return _load_json(_metrics_dir() / "detection_baseline_metrics.json")


@lru_cache
def _detection_finetuned() -> dict:
    """The fine-tuned experiment run — comparison only, never production."""
    return _load_json(_metrics_dir() / "detection_metrics.json")


@lru_cache
def _classification_metrics() -> dict:
    return _load_json(_metrics_dir() / "classification_metrics.json")


@lru_cache
def _performance_benchmark() -> dict:
    return _load_json(_metrics_dir() / "performance_benchmark.json")


@lru_cache
def _detection_training_history() -> list[dict]:
    """The fine-tuned experiment's training curve (the pretrained baseline
    has no training curve — it wasn't trained by this project)."""
    return _load_csv_records(_metrics_dir() / "detection_training_history.csv")


@lru_cache
def _classification_training_history() -> list[dict]:
    return _load_csv_records(_metrics_dir() / "classification_training_history.csv")


@lru_cache
def _classification_report() -> list[dict]:
    return _load_csv_records(_metrics_dir() / "classification_report.csv")


@lru_cache
def _confusion_matrix() -> np.ndarray:
    return np.load(_metrics_dir() / "classification_confusion_matrix.npy")


def _adapter_status() -> tuple[str, str]:
    """(status_text, device_description) for the currently configured adapter,
    without importing inference.py at module load time (avoids any import
    ordering surprises during app startup)."""
    from app.services.inference import get_adapter

    adapter = get_adapter()
    if adapter.is_ready():
        return f"loaded — serving on {adapter.device_description}", adapter.device_description
    return "not loaded", adapter.device_description


def get_models_info() -> dict:
    status_text, _ = _adapter_status()
    return {
        "mode": settings.model_mode,
        "detection": {
            "name": "YOLO11s",
            "purpose": "Object detection",
            "architecture": "CSPDarknet backbone w/ C3k2 & C2PSA (Ultralytics, official pretrained COCO weights)",
            "framework": "Ultralytics YOLOv11 / PyTorch",
            "class_count": len(COCO_CLASSES),
            "mode": settings.model_mode,
            "status": status_text if settings.model_mode == "real" else "mock inference active (no trained weights loaded)",
            "weights_path": settings.detection_model_path,
        },
        "classification": {
            "name": "ResNet50",
            "purpose": "Object classification",
            "architecture": "ImageNet-pretrained, fine-tuned (head + layer3 + layer4 unfrozen)",
            "framework": "PyTorch / Torchvision",
            "class_count": len(COCO_CLASSES),
            "mode": settings.model_mode,
            "status": status_text if settings.model_mode == "real" else "mock inference active (no trained weights loaded)",
            "weights_path": settings.classification_model_path,
        },
    }


def get_metrics() -> dict:
    baseline = _detection_baseline()
    finetuned = _detection_finetuned()
    classification = _classification_metrics()
    benchmark = _performance_benchmark()
    _, serving_device = _adapter_status()

    detection_history = [
        {
            "epoch": int(row["epoch"]),
            "box_loss": float(row["train/box_loss"]),
            "class_loss": float(row["train/cls_loss"]),
            "map50": float(row["metrics/mAP50(B)"]),
        }
        for row in _detection_training_history()
    ]

    classification_history = [
        {
            "epoch": index + 1,
            "train_accuracy": float(row["train_acc"]),
            "val_accuracy": float(row["val_acc"]),
            "val_loss": float(row["val_loss"]),
        }
        for index, row in enumerate(_classification_training_history())
    ]

    class_index = {name: i for i, name in enumerate(COCO_CLASSES)}
    matrix = _confusion_matrix()
    confusion_rows = []
    for row_class in _CONFUSION_MATRIX_CLASSES:
        row = matrix[class_index[row_class]]
        total = row.sum() or 1
        confusion_rows.append([round(float(row[class_index[col]]) / float(total), 4) for col in _CONFUSION_MATRIX_CLASSES])

    # classification_report.csv is sklearn's classification_report(output_dict=True)
    # exported to CSV, which appends "accuracy"/"macro avg"/"weighted avg" summary
    # rows after the 80 per-class rows — exclude those explicitly.
    _summary_rows = {"accuracy", "macro avg", "weighted avg"}
    per_class = [
        {
            "name": record.get("") or record.get("class_name", ""),
            "precision": round(float(record["precision"]), 4),
            "recall": round(float(record["recall"]), 4),
            "f1": round(float(record["f1-score"]), 4),
            "support": int(float(record["support"])),
        }
        for record in _classification_report()
        if (record.get("") or record.get("class_name", "")) not in _summary_rows
        and (record.get("") or record.get("class_name"))
    ]

    return {
        "is_mock": settings.model_mode != "real",
        "note": _NOTE if settings.model_mode == "real" else "Mock inference mode — these are placeholder values, not model output.",
        "detection": {
            "precision": round(float(baseline["precision"]), 4),
            "recall": round(float(baseline["recall"]), 4),
            "map50": round(float(baseline["mAP50"]), 4),
            "map50_95": round(float(baseline["mAP50_95"]), 4),
        },
        "classification": {
            "top1_accuracy": round(float(classification["top1_accuracy"]), 4),
            "top5_accuracy": round(float(classification["top5_accuracy"]), 4),
            "balanced_accuracy": round(float(classification["balanced_accuracy"]), 4),
            "macro_f1": round(float(classification["f1_macro"]), 4),
            "weighted_f1": round(float(classification["f1_weighted"]), 4),
        },
        "training_history": {
            "detection": detection_history,
            "classification": classification_history,
        },
        "confusion_matrix": {
            "classes": [c.title() if c != "traffic light" else "T-Light" for c in _CONFUSION_MATRIX_CLASSES],
            "matrix": confusion_rows,
        },
        "per_class_metrics": per_class,
        "dataset": {
            "name": "COCO 2017",
            "num_classes": len(COCO_CLASSES),
            "train_subset": f"train2017 ({finetuned.get('train_images', 12000):,} images, seed 42)",
            "val_subset": f"val2017 ({baseline.get('val_images', 4952):,} images, held out)",
        },
        "device": {
            "training_hardware": benchmark.get("device", "Not available"),
            "serving_device": serving_device,
        },
        "detection_experiment": {
            "description": "Fine-tuned YOLO11s (13 epochs, 12k-image subset) — NOT used in production; "
            "the pretrained baseline above scored higher.",
            "precision": round(float(finetuned["precision"]), 4),
            "recall": round(float(finetuned["recall"]), 4),
            "map50": round(float(finetuned["mAP50"]), 4),
            "map50_95": round(float(finetuned["mAP50_95"]), 4),
        },
    }
