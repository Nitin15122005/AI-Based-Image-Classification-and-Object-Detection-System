import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import AnalysisResponse, HistoryItemResponse, HistoryListResponse
from app.services.analysis_service import rerun_analysis
from app.services.history_service import delete_analysis, get_analysis, list_history

logger = logging.getLogger("visionai.history")

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=HistoryListResponse)
def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    sort: str = Query("newest"),
    db: Session = Depends(get_db),
) -> HistoryListResponse:
    result = list_history(db, page=page, page_size=page_size, search=search, status=status_filter, sort=sort)
    return HistoryListResponse(
        items=[HistoryItemResponse.from_orm_analysis(a) for a in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


def _get_or_404(db: Session, analysis_id: str):
    analysis = get_analysis(db, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No analysis found with id '{analysis_id}'.")
    return analysis


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_history_item(analysis_id: str, db: Session = Depends(get_db)) -> AnalysisResponse:
    analysis = _get_or_404(db, analysis_id)
    return AnalysisResponse.from_orm_analysis(analysis)


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history_item(analysis_id: str, db: Session = Depends(get_db)) -> None:
    analysis = _get_or_404(db, analysis_id)
    delete_analysis(db, analysis)
    logger.info("analysis deleted: id=%s", analysis_id)


@router.post("/{analysis_id}/rerun", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
def rerun_history_item(analysis_id: str, db: Session = Depends(get_db)) -> AnalysisResponse:
    source = _get_or_404(db, analysis_id)
    try:
        new_analysis = rerun_analysis(db, source=source)
    except Exception:
        logger.exception("rerun failed for id=%s", analysis_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Re-running this analysis failed."
        )
    logger.info("analysis rerun: source=%s new_id=%s", analysis_id, new_analysis.id)
    return AnalysisResponse.from_orm_analysis(new_analysis)
