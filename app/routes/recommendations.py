from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from app.state_store import store
from app.tick_loop import get_controller
from core.schemas import DecisionLogRow, Recommendation
from core.time_utils import wib_now_iso

router = APIRouter(tags=["recommendations"])


@router.get("/recommendations/top", response_model=List[Recommendation])
def get_recommendations_top() -> List[Recommendation]:
    return store.get_recommendations()


@router.post("/recommendations/{recommendationId}/apply")
def apply_recommendation(recommendationId: str) -> Dict[str, Any]:
    rec = store.apply_recommendation(recommendationId)
    if rec is None:
        raise HTTPException(
            status_code=404,
            detail=f"Recommendation '{recommendationId}' not found.",
        )

    # Apply the signal adjustment via the controller
    controller = get_controller(rec.targetIntersectionId)
    if controller is not None:
        controller.apply_adjustment(rec.targetApproach, rec.deltaSeconds)

    # Append decision log entry
    store.append_decision_log(
        DecisionLogRow(
            timestamp=wib_now_iso(),
            locationName=rec.targetLocationName,
            eventType="Recommendation Applied",
            aiPrediction=(
                f"Green extend {rec.targetApproach} +{rec.deltaSeconds}s; "
                f"risk {rec.congestionRiskPercent if hasattr(rec, 'congestionRiskPercent') else 'N/A'}%"
            ),
            humanAction="Applied",
            outcome="Signal plan adjusted.",
            details=rec.alertDescription,
        )
    )

    return {
        "recommendationId": recommendationId,
        "status": "APPLIED",
        "appliedAt": wib_now_iso(),
    }


@router.post("/recommendations/{recommendationId}/reject")
def reject_recommendation(recommendationId: str) -> Dict[str, Any]:
    rec = store.reject_recommendation(recommendationId)
    if rec is None:
        raise HTTPException(
            status_code=404,
            detail=f"Recommendation '{recommendationId}' not found.",
        )

    store.append_decision_log(
        DecisionLogRow(
            timestamp=wib_now_iso(),
            locationName=rec.targetLocationName,
            eventType="Recommendation Rejected",
            aiPrediction=rec.alertTitle,
            humanAction="Rejected",
            outcome="No signal change.",
            details=rec.alertDescription,
        )
    )

    return {
        "recommendationId": recommendationId,
        "status": "REJECTED",
        "rejectedAt": wib_now_iso(),
    }
