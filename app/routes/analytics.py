from typing import Any, Dict, List

from fastapi import APIRouter, Query

from app.state_store import store
from core.schemas import DecisionLogRow

router = APIRouter(tags=["analytics"])

# Days of week and hour labels for the dummy heatmap
_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
_PEAK_PATTERN = [
    # hour: 0  1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23
         [  5,  3,  2,  2,  3,  8, 20, 55, 80, 70, 60, 55, 65, 60, 58, 62, 75, 85, 70, 50, 35, 20, 12,  7],  # Mon
         [  5,  3,  2,  2,  3,  8, 20, 55, 78, 68, 58, 54, 63, 59, 57, 61, 74, 83, 68, 48, 33, 19, 11,  6],  # Tue
         [  5,  3,  2,  2,  3,  8, 20, 57, 82, 72, 62, 57, 67, 62, 60, 64, 77, 87, 72, 52, 37, 22, 13,  7],  # Wed
         [  5,  3,  2,  2,  3,  8, 20, 56, 79, 69, 59, 55, 64, 60, 58, 63, 76, 84, 70, 50, 35, 20, 12,  7],  # Thu
         [  5,  3,  2,  2,  3,  8, 22, 58, 83, 73, 63, 58, 68, 63, 61, 66, 80, 90, 76, 55, 40, 25, 15,  8],  # Fri
         [  3,  2,  2,  2,  3,  5, 10, 25, 45, 60, 70, 72, 75, 73, 70, 68, 65, 62, 58, 50, 40, 28, 18, 10],  # Sat
         [  3,  2,  2,  2,  2,  4,  8, 18, 35, 50, 62, 65, 68, 66, 63, 60, 57, 54, 50, 42, 32, 22, 14,  8],  # Sun
]


@router.get("/analytics/heatmap")
def get_heatmap(days: int = Query(default=7, ge=1, le=30)) -> Dict[str, Any]:
    """
    Returns a week-shaped heatmap matrix (7 days × 24 hours) with congestion
    intensity 0-100.  The pattern is deterministic and plausible (rush-hour
    peaks on weekday mornings and evenings).
    """
    matrix = [
        {
            "day": _DAYS[d],
            "hours": [
                {"hour": h, "intensity": _PEAK_PATTERN[d][h]}
                for h in range(24)
            ],
        }
        for d in range(7)
    ]
    return {
        "days": days,
        "matrix": matrix,
        "acceptanceRate": 87.5,
        "recurringCauses": ["Peak hour volume", "Weather: Rain", "Incident spillback"],
        "decisionLog": [row.model_dump() for row in store.get_decision_log(limit=10)],
    }


@router.get("/analytics/decision-log", response_model=List[DecisionLogRow])
def get_decision_log(
    limit: int = Query(default=100, ge=1, le=1000),
) -> List[DecisionLogRow]:
    return store.get_decision_log(limit=limit)
