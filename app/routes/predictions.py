from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

from app.state_store import store
from core.schemas import Prediction15m

router = APIRouter(tags=["predictions"])


@router.get(
    "/intersections/{intersectionId}/prediction/15m",
    response_model=Prediction15m,
)
def get_prediction_15m(intersectionId: str) -> Prediction15m:
    pred = store.get_prediction15m(intersectionId)
    if pred is None:
        raise HTTPException(
            status_code=404,
            detail=f"No 15-minute prediction yet for intersection '{intersectionId}'.",
        )
    return pred


@router.get("/intersections/{intersectionId}/forecast")
def get_forecast(
    intersectionId: str,
    horizons: str = Query(default="2h,4h", description="Comma-separated horizon labels, e.g. 2h,4h"),
) -> Dict[str, Any]:
    requested = [h.strip() for h in horizons.split(",") if h.strip()]
    result: Dict[str, Any] = {}
    for horizon in requested:
        points = store.get_forecast(intersectionId, horizon)
        result[horizon] = points
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No forecast data yet for intersection '{intersectionId}'.",
        )
    return result
