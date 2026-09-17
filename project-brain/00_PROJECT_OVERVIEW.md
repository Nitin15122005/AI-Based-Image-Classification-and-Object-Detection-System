# 00 — Project Overview

## Purpose
An internship capstone building a complete, deployable computer-vision **product** — not a notebook exercise. Users upload an image and receive multi-object detection (bounding boxes + class names + confidence) followed by per-object classification (class + confidence + top-K predictions), with results saved for later review and model performance made transparent.

## Final Objective
Ship an end-to-end system: a React web app, a FastAPI backend with a separate inference layer, and real trained/evaluated ML models (YOLO11s for detection, ResNet50 for classification) on COCO 2017 (80 classes).

## Target Users
- Reviewers/evaluators of the capstone (technical depth must be visible: real metrics, real training artifacts).
- End users of the demo product: anyone uploading an image to see detection + classification results.

## Final Product
A responsive web app with six pages (Home, Analyze, Results, History, History Details, Models & Metrics) backed by a REST API. Pipeline: image upload → YOLO11s detection → crop each detection → ResNet50 classification → combined structured JSON response → annotated image + history record.

## Architecture
```
┌─────────────┐      REST/JSON       ┌──────────────┐      ┌───────────────────┐
│  Frontend   │  ──────────────────▶ │   FastAPI    │ ───▶ │  Inference Layer   │
│  React+Vite │ ◀────────────────── │   Backend    │ ◀─── │ YOLO11s → crop →   │
│  Tailwind   │   annotated image,   │  (REST API)  │      │ ResNet50 classify  │
└─────────────┘   JSON result, hist. └──────────────┘      └───────────────────┘
                                            │
                                            ▼
                                   history store (DB/files)
                                   model artifacts (weights,
                                   metrics, plots)
```
The inference layer is decoupled from API routing (own module(s) under `backend/`, or `ml/` if invoked as a library) so models can be swapped/retrained without touching route logic.

## Technology Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router, Recharts (or equivalent) for charts. Visual design starts as a Stitch-generated static HTML prototype (`frontend/stitch-design/`), converted into componentized React.
- **Backend**: FastAPI, REST API, separate inference layer module.
- **ML**: PyTorch-ecosystem YOLO11s (detection) + ResNet50 (classification, transfer learning), trained on Google Colab (NVIDIA T4).
- **Dataset**: COCO 2017, 80 classes; train2017 subset for training, val2017 held out for validation. Classification dataset = object crops generated from COCO annotations.

## Scope
**In scope**: detection, classification, combined inference API, results UI, history (save/review), model metrics page, Docker-ready deployment direction.
**Out of scope** (unless later revised): user authentication/multi-tenant accounts, video/stream input, custom dataset labeling tools, mobile native apps.

## Current Phase / Status
- Repository initialized; Stitch static HTML prototype exists for all 5 core screens plus an editorial design system spec (`frontend/stitch-design/`).
- No React app, backend, or ML training has been implemented yet.
- Current step: establishing project-brain documentation (this file and siblings) before scaffolding code.
- Next planned step per GitHub workflow: project setup → project brain (this) → Stitch prototype (done) → React frontend → ML training → backend → API integration → testing → Docker/deployment → final documentation.
