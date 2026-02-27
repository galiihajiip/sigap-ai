from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Dict, List, Optional

from core.config import DEFAULT_SYSTEM_CONFIDENCE_PERCENT
from core.schemas import Recommendation
from core.time_utils import now_iso
from rec.rules import evaluate

if TYPE_CHECKING:
    from app.state_store import StateStore

# Maximum recommendations returned
_TOP_N = 3


def generate_top_recommendations(state: "StateStore") -> List[Recommendation]:
    """
    Inspect every intersection in the state store and produce up to
    ``_TOP_N`` Recommendation objects, ordered by severity
    (density desc, then total queue desc).

    Parameters
    ----------
    state : StateStore
        The live application state store singleton.

    Returns
    -------
    list[Recommendation]
        Up to 3 pending recommendations ready for the UI.
    """
    candidates: List[Dict] = []

    intersections = state.get_intersections()
    for intersection_summary in intersections:
        iid = intersection_summary.intersectionId
        location_name = intersection_summary.locationName

        # Live metrics (may not exist yet for very first tick)
        live = state.get_live(iid)
        if live is None:
            continue

        # Per-approach queue from intersection sim (stored as raw dict in
        # the liveMetrics extras; fall back to a uniform split)
        queue_per_approach = _get_queue_per_approach(state, iid, live.queueLengthVehicles)

        # Current green-seconds from signal plan
        plan = intersection_summary.currentSignalPlan  # dict with greenSeconds etc.
        # currentSignalPlan may be per-approach or a single flat dict depending on
        # how the tick loop populates it; handle both shapes.
        current_greens = _extract_greens(plan, queue_per_approach)

        # Confidence from latest 15-min prediction if available
        pred = state.get_prediction15m(iid)
        confidence = (
            pred.systemConfidencePercent
            if pred is not None
            else DEFAULT_SYSTEM_CONFIDENCE_PERCENT
        )

        # Approximate departures per tick from flow rate
        # flowRateCarsPerMin × SIM_MINUTES_PER_TICK ≈ departures last tick
        from core.config import SIM_MINUTES_PER_TICK
        departures_per_tick = live.flowRateCarsPerMin * SIM_MINUTES_PER_TICK

        rec_dict = evaluate(
            intersection_id=iid,
            location_name=location_name,
            density_percent=live.densityPercent,
            queue_per_approach=queue_per_approach,
            current_greens=current_greens,
            departures_per_tick=departures_per_tick,
            confidence_percent=confidence,
        )

        if rec_dict is not None:
            rec_dict["_density"] = live.densityPercent
            rec_dict["_queue"] = live.queueLengthVehicles
            candidates.append(rec_dict)

    # Sort by density desc, total queue desc
    candidates.sort(key=lambda r: (r["_density"], r["_queue"]), reverse=True)

    # Strip internal sort keys and build Recommendation objects
    top: List[Recommendation] = []
    for c in candidates[:_TOP_N]:
        c.pop("_density", None)
        c.pop("_queue", None)
        top.append(Recommendation(**c))

    # Keep dashboard actionable even when congestion is below hard threshold.
    if not top and intersections:
        advisory = _build_advisory_recommendation(state, intersections[0])
        if advisory is not None:
            top.append(advisory)

    return top


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _get_queue_per_approach(
    state: "StateStore", iid: str, total_queue: int
) -> Dict[str, int]:
    """
    Try to retrieve per-approach queue from the state store snapshot.
    The tick loop may store it under a dedicated key; if not available,
    distribute total_queue proportionally across N/E/S/W (S/N get 3/8 each,
    E/W get 1/8 each — matching lane-count weights).
    """
    snapshot = state.get_snapshot()
    raw_queues = snapshot.get("queuePerApproach", {}).get(iid)
    if raw_queues and isinstance(raw_queues, dict):
        return {a: int(v) for a, v in raw_queues.items()}

    # Fallback: proportional split based on lane weights (N:3 E:2 S:3 W:2 → total 10)
    weights = {"N": 3, "E": 2, "S": 3, "W": 2}
    total_weight = sum(weights.values())
    return {a: round(total_queue * w / total_weight) for a, w in weights.items()}


def _extract_greens(
    signal_plan: dict,
    queue_per_approach: Dict[str, int],
) -> Dict[str, int]:
    """
    Extract per-approach green seconds from the signal plan dict.

    Handles two shapes:
    - Per-approach: {"N": {"greenSeconds": 45, ...}, ...}
    - Flat:         {"greenSeconds": 45, "redSeconds": 40, "yellowSeconds": 5}
      (same green applied to all approaches as fallback)
    """
    from core.config import DEFAULT_GREEN_SECONDS

    approaches = list(queue_per_approach.keys()) or ["N", "E", "S", "W"]

    # Per-approach shape
    if approaches and isinstance(signal_plan.get(approaches[0]), dict):
        return {
            a: int(signal_plan[a].get("greenSeconds", DEFAULT_GREEN_SECONDS.get(a, 45)))
            for a in approaches
        }

    # Flat shape — use DEFAULT_GREEN_SECONDS per approach
    flat_green = signal_plan.get("greenSeconds")
    if flat_green is not None:
        return {a: int(flat_green) for a in approaches}

    return dict(DEFAULT_GREEN_SECONDS)


def _build_advisory_recommendation(
    state: "StateStore",
    intersection_summary,
) -> Optional[Recommendation]:
    iid = intersection_summary.intersectionId
    live = state.get_live(iid)
    if live is None:
        return None

    queue_per_approach = _get_queue_per_approach(state, iid, live.queueLengthVehicles)
    current_greens = _extract_greens(intersection_summary.currentSignalPlan, queue_per_approach)
    target_approach = max(queue_per_approach, key=queue_per_approach.get) if queue_per_approach else "S"
    current_green = current_greens.get(target_approach, 45)

    # Small proactive adjustment suggestion for moderate traffic.
    delta = 5 if live.densityPercent < 70 else 8
    recommended_green = current_green + delta

    pred = state.get_prediction15m(iid)
    confidence = (
        pred.systemConfidencePercent
        if pred is not None
        else DEFAULT_SYSTEM_CONFIDENCE_PERCENT
    )

    return Recommendation(
        recommendationId=f"REC-{uuid.uuid4().hex[:8].upper()}",
        createdAt=now_iso(),
        status="PENDING",
        targetLocationName=intersection_summary.locationName,
        targetIntersectionId=iid,
        targetApproach=target_approach,
        alertTitle="Advisory: Traffic Flow Optimization",
        alertDescription=(
            "Arus masih stabil, namun model menyarankan optimasi kecil "
            f"untuk approach {target_approach} agar antrean tetap rendah."
        ),
        predictedDelayIfNoActionMinutes=round(max(1.0, live.waitTimeMinutes), 1),
        currentGreenSeconds=current_green,
        recommendedGreenSeconds=recommended_green,
        deltaSeconds=delta,
        confidencePercent=confidence,
    )
