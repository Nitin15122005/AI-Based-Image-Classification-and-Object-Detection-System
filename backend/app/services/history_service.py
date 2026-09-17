"""Query and mutation helpers for the analysis history list/detail/delete
endpoints. Kept separate from `analysis_service` (which creates analyses)
since this module only ever reads or removes existing rows.
"""
from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from app.models import Analysis
from app.services.image_service import delete_analysis_images

VALID_SORTS = {"newest", "oldest", "confidence", "objects"}


@dataclass
class HistoryPage:
    items: list[Analysis]
    total: int
    page: int
    page_size: int


def list_history(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status: str | None = None,
    sort: str = "newest",
) -> HistoryPage:
    query = db.query(Analysis)

    if search:
        like = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(func.lower(Analysis.filename).like(like), func.lower(Analysis.summary).like(like))
        )

    if status:
        query = query.filter(Analysis.status == status)

    sort_key = sort if sort in VALID_SORTS else "newest"
    if sort_key == "oldest":
        query = query.order_by(Analysis.created_at.asc())
    elif sort_key == "confidence":
        query = query.order_by(Analysis.average_confidence.desc())
    elif sort_key == "objects":
        query = query.order_by(Analysis.objects_detected.desc())
    else:
        query = query.order_by(Analysis.created_at.desc())

    total = query.count()
    items = (
        query.options(selectinload(Analysis.detections))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return HistoryPage(items=items, total=total, page=page, page_size=page_size)


def get_analysis(db: Session, analysis_id: str) -> Analysis | None:
    return (
        db.query(Analysis)
        .options(selectinload(Analysis.detections))
        .filter(Analysis.id == analysis_id)
        .one_or_none()
    )


def delete_analysis(db: Session, analysis: Analysis) -> None:
    """Removes the DB row (detections cascade) and both stored image
    files. File deletion is best-effort and never blocks the DB delete."""
    delete_analysis_images(analysis.original_image_path, analysis.annotated_image_path)
    db.delete(analysis)
    db.commit()
