# 03 — ML & Backend

## Dataset
- **Source**: COCO 2017 (80 object classes).
- **Detection split**: subset of `train2017` for training; full/subset of `val2017` held out, untouched during training, used only for evaluation.
- **Sampling**: deterministic (fixed random seed), sample size and seed documented in the training config/notebook so the split is reproducible.
- **Classification dataset**: generated, not downloaded — object crops extracted from COCO bounding-box annotations, one crop per annotated instance, labeled by its COCO category (80 classes). Crop generation script/notebook lives under `ml/training/`.
- Raw COCO data and generated crops are **not committed to Git** (too large) — see Deployment/Storage below.

## Model Choices
- **Detection**: YOLO11s, pretrained COCO weights as the starting point, fine-tuned via transfer learning on the prepared train subset.
- **Classification**: ResNet50, pretrained ImageNet weights, transfer learning + fine-tuning on the COCO-crop dataset (80-class output head).
- Rationale: both are pretrained-available, well-supported, and appropriately sized for Colab T4 training within capstone time constraints.

## Training Strategy
- **Environment**: Google Colab, NVIDIA T4 GPU.
- **Approach**: start from pretrained weights; freeze/unfreeze layers progressively as needed; fine-tune on the prepared datasets.
- **Detection**: standard YOLO training loop (Ultralytics-style config) against the COCO-format subset; bounding-box annotations converted/validated into the format the training pipeline expects before training starts.
- **Classification**: standard image-classification fine-tuning loop (augmentation, LR schedule, early stopping/checkpointing on validation performance).
- Real training/evaluation only — no fabricated or estimated metrics anywhere in the project.

## Evaluation
- **Detection metrics** (on held-out val2017 subset): Precision, Recall, mAP50, mAP50-95.
- **Classification metrics** (on held-out crop validation split): Top-1 Accuracy, Top-5 Accuracy, Balanced Accuracy, Precision, Recall, Macro F1, Weighted F1.
- **Detection artifacts to save**: best model weights, training curve plots, prediction example images (annotated), error analysis notes (e.g., common false positives/negatives, class confusions, small-object performance).
- **Classification artifacts to save**: best model weights, confusion matrix, classification report (per-class precision/recall/F1), examples of correct and incorrect predictions.
- All artifacts saved under `ml/models/` (weights) and `ml/training/` or `ml/models/eval/` (plots, reports, examples) — exact subfolder layout decided when the training code is written, but must be consistent and referenced by the backend's Models & Metrics endpoint.

## Inference Pipeline
```
uploaded image
   → YOLO11s detection (boxes, class ids, confidences)
   → for each detection: crop region from original image
   → ResNet50 classification per crop (class, confidence, top-K)
   → merge detection + classification per object
   → render annotated image (boxes + labels drawn on a copy)
   → assemble structured response (below)
```
- The pipeline is implemented as a standalone inference module (e.g., `ml/inference/` or `backend/inference/`), callable independently of FastAPI routing, so it can be tested, reused in notebooks, or swapped without touching API code.
- Confidence threshold (from the Analyze page) is a pipeline parameter, applied at the detection stage.

## Result Object (conceptual shape)
```json
{
  "file_info": { "filename": "...", "width": 0, "height": 0, "format": "jpeg", "size_bytes": 0 },
  "processing_time_ms": 0,
  "annotated_image_url": "/media/results/<id>.jpg",
  "detections": [
    {
      "id": 0,
      "bbox": { "x": 0, "y": 0, "width": 0, "height": 0 },
      "detection_class": "person",
      "detection_confidence": 0.0,
      "classification_class": "person",
      "classification_confidence": 0.0,
      "top_k_classifications": [
        { "class": "person", "confidence": 0.0 }
      ]
    }
  ]
}
```
This shape is the contract between the inference layer, the FastAPI response model, and the frontend's Results/History Details rendering — keep all three in sync when it changes.

## FastAPI Endpoints (planned)
- `POST /api/analyze` — accepts image upload (+ optional confidence threshold), runs the inference pipeline, returns the result object above, persists a history record.
- `GET /api/history` — list saved analyses (paginated; supports search/filter/sort query params matching the History page).
- `GET /api/history/{id}` — retrieve one saved analysis (History Details).
- `DELETE /api/history/{id}` — remove a saved analysis.
- `GET /api/media/{path}` — serve original/annotated images and downloadable artifacts.
- `GET /api/metrics` — return saved model evaluation metrics/artifact references for the Models & Metrics page.
- `GET /api/health` — basic liveness check (used by the frontend's "backend unavailable" state).

Exact route names/paths may be refined during backend implementation; this list defines required capability, not a frozen contract.

## Deployment / Storage Direction
- **Do not commit**: raw COCO dataset, generated crop dataset, trained model weights, large result/history media — all excluded via `.gitignore`.
- **Model weights**: handled via Git LFS, GitHub Releases, or external cloud storage (exact mechanism chosen during backend/ML implementation phase) — the repo must document how to fetch them, not embed them.
- **History/media storage**: local filesystem + lightweight DB (e.g., SQLite) is sufficient for the capstone; must persist across backend restarts.
- **Containerization**: Docker direction — separate images/services conceptually for frontend (static build) and backend (FastAPI + inference dependencies); GPU vs. CPU inference at serving time should be configurable, and actual device used should be reported on the Models & Metrics page ("model/device information").
