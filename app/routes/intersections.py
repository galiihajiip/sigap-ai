from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from app.state_store import store
from app.tick_loop import get_controller
from core.schemas import AdjustRequest, DecisionLogRow, IntersectionSummary, LiveMetrics, PredictionTimeline
from core.time_utils import wib_now_iso

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
def adjust_intersection(
    intersectionId: str, body: AdjustRequest
) -> Dict[str, Any]:
    controller = get_controller(intersectionId)
    if controller is None:
        raise HTTPException(
            status_code=404,
            detail=f"Intersection '{intersectionId}' not found.",
        )

    previous_green = controller.current_green(body.approach)
    controller.apply_adjustment(body.approach, body.deltaSeconds)
    new_green = controller.current_green(body.approach)

    store.append_decision_log(
        DecisionLogRow(
            timestamp=wib_now_iso(),
            locationName=intersectionId,
            eventType="Manual Adjustment",
            aiPrediction="N/A",
            humanAction="Applied",
            outcome=f"Green {body.approach}: {previous_green}s → {new_green}s.",
            details=f"deltaSeconds={body.deltaSeconds}",
        )
    )

    return {
        "intersectionId": intersectionId,
        "approach": body.approach,
        "previousGreenSeconds": previous_green,
        "newGreenSeconds": new_green,
        "adjustedAt": wib_now_iso(),
    }
