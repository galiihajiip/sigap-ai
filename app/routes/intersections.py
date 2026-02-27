from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from app.state_store import store
from core.schemas import IntersectionSummary, LiveMetrics, PredictionTimeline

router = APIRouter(tags=["intersections"])


@router.get("/intersections", response_model=List[IntersectionSummary])
def get_intersections() -> List[IntersectionSummary]:
    return store.get_intersections()


@router.get("/intersections/{intersectionId}/live")
def get_intersection_live(intersectionId: str) -> Dict[str, Any]:
    live = store.get_live(intersectionId)
    if live is None:
        raise HTTPException(
            status_code=404,
            detail=f"No live metrics yet for intersection '{intersectionId}'.",
        )
    timeline = store.get_timeline(intersectionId)
    return {
        "live": live.model_dump(),
        "timeline": timeline.model_dump() if timeline is not None else None,
    }


@router.post("/intersections/{intersectionId}/adjust")
def adjust_intersection(intersectionId: str) -> Dict[str, Any]:
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})
