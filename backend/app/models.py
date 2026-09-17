"""SQLAlchemy ORM models.

Two tables: `analyses` (one row per analysis run, whether from a fresh
upload or a re-run) and `detections` (one row per detected object,
foreign-keyed to its analysis with cascading delete). Nested/variable-shape
data (bounding box, top-K classifications) lives in JSONB columns since it
is always read/written as a whole rather than queried by sub-field.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# This project uses PostgreSQL everywhere (dev, test, prod) — JSONB only.
JSON_TYPE = JSONB


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_image_path: Mapped[str] = mapped_column(String(512), nullable=False)
    annotated_image_path: Mapped[str | None] = mapped_column(String(512), nullable=True)

    status: Mapped[str] = mapped_column(String(32), nullable=False, default="completed")
    processing_time: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    width: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    height: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    image_format: Mapped[str] = mapped_column(String(16), nullable=False, default="jpeg")

    objects_detected: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    average_confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    detection_model_name: Mapped[str] = mapped_column(String(64), nullable=False, default="YOLO11s")
    classification_model_name: Mapped[str] = mapped_column(String(64), nullable=False, default="ResNet50")

    confidence_threshold: Mapped[float] = mapped_column(Float, nullable=False, default=0.25)
    detection_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    classification_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    top_classifications: Mapped[list | None] = mapped_column(JSON_TYPE, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # clock_timestamp() (unlike now()/CURRENT_TIMESTAMP) reflects actual
    # statement execution time rather than transaction-start time, so
    # ordering by created_at stays correct even for multiple analyses
    # created within the same transaction.
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.clock_timestamp())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.clock_timestamp(), onupdate=func.clock_timestamp()
    )

    detections: Mapped[list["Detection"]] = relationship(
        "Detection",
        back_populates="analysis",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Detection.id",
    )


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True
    )

    class_name: Mapped[str] = mapped_column(String(64), nullable=False)
    detection_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    bbox: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)

    classification_class_name: Mapped[str] = mapped_column(String(128), nullable=False)
    classification_confidence: Mapped[float] = mapped_column(Float, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="detections")
