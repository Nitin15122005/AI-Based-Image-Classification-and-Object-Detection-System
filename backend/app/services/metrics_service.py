"""Model metadata and evaluation metrics for GET /api/v1/models and
GET /api/v1/metrics.

Every number here is explicitly labeled mock/placeholder data (see
`is_mock` / `note` fields) until the Colab training notebook produces real
metrics — see project-brain/03_ML_BACKEND.md. Values are kept in sync by
hand with `frontend/src/data/mockData.js` so the UI and API agree while
both are mocked.
"""
from __future__ import annotations

from app.config import settings
from app.utils.coco_classes import COCO_CLASSES

_MOCK_NOTE = "Placeholder values for UI/API development. Not derived from a trained model."


def get_models_info() -> dict:
    is_mock = settings.model_mode != "real"
    return {
        "mode": settings.model_mode,
        "detection": {
            "name": "YOLO11s",
            "purpose": "Object detection",
            "architecture": "CSPDarknet backbone w/ C3k2 & C2PSA (YOLOv11-small)",
            "framework": "Ultralytics YOLOv11 / PyTorch",
            "class_count": len(COCO_CLASSES),
            "mode": settings.model_mode,
            "status": "mock inference active (no trained weights loaded)"
            if is_mock
            else "real weights loaded",
            "weights_path": settings.detection_model_path,
        },
        "classification": {
            "name": "ResNet50",
            "purpose": "Object/scene classification",
            "architecture": "Deep residual network, 50 layers",
            "framework": "PyTorch / Torchvision",
            "class_count": len(COCO_CLASSES),
            "mode": settings.model_mode,
            "status": "mock inference active (no trained weights loaded)"
            if is_mock
            else "real weights loaded",
            "weights_path": settings.classification_model_path,
        },
    }


def get_metrics() -> dict:
    return {
        "is_mock": True,
        "note": _MOCK_NOTE,
        "detection": {
            "precision": 0.886,
            "recall": 0.821,
            "map50": 0.528,
            "map50_95": 0.384,
        },
        "classification": {
            "top1_accuracy": 0.768,
            "top5_accuracy": 0.934,
            "balanced_accuracy": 0.791,
            "macro_f1": 0.812,
            "weighted_f1": 0.845,
        },
        "training_history": {
            "detection": [
                {
                    "epoch": epoch,
                    "box_loss": round(0.52 - (epoch / 50) * 0.438, 4),
                    "class_loss": round(0.40 - (epoch / 50) * 0.359, 4),
                    "map50": round(0.02 + (epoch / 50) * 0.508, 4),
                }
                for epoch in range(1, 51, 3)
            ],
            "classification": [
                {
                    "epoch": epoch,
                    "train_accuracy": round(0.32 + (epoch / 50) * 0.504, 4),
                    "val_accuracy": round(0.28 + (epoch / 50) * 0.488, 4),
                    "val_loss": round(1.62 - (epoch / 50) * 1.078, 4),
                }
                for epoch in range(1, 51, 3)
            ],
        },
        "confusion_matrix": {
            "classes": ["Person", "Car", "Dog", "Bicycle", "Chair", "Laptop", "Bottle", "Backpack", "T-Light", "Bus"],
            "matrix": [
                [0.94, 0.01, 0.00, 0.02, 0.01, 0.00, 0.00, 0.02, 0.00, 0.00],
                [0.01, 0.93, 0.00, 0.01, 0.00, 0.00, 0.00, 0.00, 0.01, 0.04],
                [0.01, 0.00, 0.95, 0.00, 0.02, 0.00, 0.00, 0.01, 0.00, 0.00],
                [0.04, 0.02, 0.00, 0.89, 0.01, 0.00, 0.00, 0.03, 0.01, 0.00],
                [0.02, 0.01, 0.03, 0.01, 0.85, 0.01, 0.02, 0.04, 0.00, 0.01],
                [0.01, 0.00, 0.00, 0.00, 0.02, 0.91, 0.01, 0.03, 0.01, 0.00],
                [0.02, 0.00, 0.00, 0.00, 0.01, 0.01, 0.86, 0.06, 0.03, 0.00],
                [0.04, 0.00, 0.01, 0.02, 0.03, 0.02, 0.03, 0.84, 0.00, 0.00],
                [0.01, 0.01, 0.00, 0.01, 0.00, 0.00, 0.03, 0.01, 0.93, 0.00],
                [0.01, 0.06, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.01, 0.92],
            ],
        },
        "per_class_metrics": [
            {"name": "Person", "precision": 0.94, "recall": 0.92, "f1": 0.93, "support": 2841},
            {"name": "Car", "precision": 0.91, "recall": 0.89, "f1": 0.90, "support": 1912},
            {"name": "Dog", "precision": 0.93, "recall": 0.95, "f1": 0.94, "support": 412},
            {"name": "Bicycle", "precision": 0.87, "recall": 0.85, "f1": 0.86, "support": 356},
            {"name": "Chair", "precision": 0.82, "recall": 0.80, "f1": 0.81, "support": 987},
            {"name": "Laptop", "precision": 0.89, "recall": 0.88, "f1": 0.885, "support": 298},
            {"name": "Bottle", "precision": 0.80, "recall": 0.83, "f1": 0.815, "support": 743},
            {"name": "Backpack", "precision": 0.81, "recall": 0.79, "f1": 0.80, "support": 401},
            {"name": "Traffic Light", "precision": 0.90, "recall": 0.91, "f1": 0.905, "support": 634},
            {"name": "Bus", "precision": 0.92, "recall": 0.90, "f1": 0.91, "support": 289},
        ],
        "dataset": {
            "name": "COCO 2017",
            "num_classes": len(COCO_CLASSES),
            "train_subset": "train2017 (deterministic sample)",
            "val_subset": "val2017 (held out)",
        },
        "device": {
            "training_hardware": "Google Colab — NVIDIA T4 GPU",
            "serving_device": "CPU (mock)" if settings.model_mode != "real" else "configured at deploy time",
        },
    }
