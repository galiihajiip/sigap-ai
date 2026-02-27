from __future__ import annotations

import uuid
from typing import Dict, Optional

from core.config import (
    CONGESTION_ALERT_CAPACITY_PERCENT,
    DEFAULT_SYSTEM_CONFIDENCE_PERCENT,
    MAX_GREEN_SECONDS,
    MIN_GREEN_SECONDS,
    SIM_MINUTES_PER_TICK,
)
from core.time_utils import now_iso
from rec.safety import clamp_green_seconds

# Approach display names for human-readable alert titles
_APPROACH_NAMES: Dict[str, str] = {
    "N": "Northbound",
    "E": "Eastbound",
    "S": "Southbound",
    "W": "Westbound",
}

# Maximum extra green we'll ever recommend in one step
_MAX_DELTA = 20


def _select_target_approach(queue_per_approach: Dict[str, int]) -> str:
    """
    Choose the approach to target.

    Prefers "S" (mainline southbound) if it has the largest queue, otherwise
    returns whichever approach has the most queued vehicles.
    """
    if not queue_per_approach:
        return "S"
    max_queue = max(queue_per_approach.values())
    if queue_per_approach.get("S", 0) == max_queue:
        return "S"
    return max(queue_per_approach, key=lambda a: queue_per_approach[a])


def _proportional_delta(queue_approach: int, total_queue: int) -> int:
    """
    Compute extra green proportional to how much of the total queue is on the
    target approach.  Capped at _MAX_DELTA.

    delta = round(_MAX_DELTA * queue_approach / max(1, total_queue))
    """
    raw = _MAX_DELTA * queue_approach / max(1, total_queue)
    return max(1, min(_MAX_DELTA, round(raw)))


def _predicted_delay(total_queue: int, departures_per_tick: float) -> float:
    """
    Estimate delay-if-no-action in minutes.

    delay = (total_queue / max(1, departures)) × SIM_MINUTES_PER_TICK
    """
    return round(total_queue / max(1.0, departures_per_tick) * SIM_MINUTES_PER_TICK, 1)


def _risk_label(density_percent: float) -> str:
    if density_percent >= 90:
        return "Critical"
    if density_percent >= CONGESTION_ALERT_CAPACITY_PERCENT:
        return "High"
    if density_percent >= 50:
        return "Moderate"
    return "Smooth"


def evaluate(
    *,
    intersection_id: str,
    location_name: str,
    density_percent: float,
    queue_per_approach: Dict[str, int],
    current_greens: Dict[str, int],
    departures_per_tick: float,
    confidence_percent: float = DEFAULT_SYSTEM_CONFIDENCE_PERCENT,
) -> Optional[Dict]:
    """
    Evaluate current traffic state and return a Recommendation-compatible dict
    if the congestion threshold is met, otherwise return None.

    Parameters
    ----------
    intersection_id : str
    location_name   : str
    density_percent : float   – overall density (0-100)
    queue_per_approach : dict – approach -> queued vehicles
    current_greens  : dict    – approach -> current green seconds
    departures_per_tick : float – vehicles discharged last tick (all approaches)
    confidence_percent  : float – model confidence override
    """
    if density_percent < CONGESTION_ALERT_CAPACITY_PERCENT:
        return None

    total_queue = sum(queue_per_approach.values())
    approach = _select_target_approach(queue_per_approach)
    approach_name = _APPROACH_NAMES.get(approach, approach)

    current_green = current_greens.get(approach, 45)
    delta = _proportional_delta(queue_per_approach.get(approach, 0), total_queue)
    recommended_green = clamp_green_seconds(current_green + delta)
    actual_delta = recommended_green - current_green

    delay_minutes = _predicted_delay(total_queue, departures_per_tick)

    alert_title = f"Critical Alert: {approach_name} Density"
    alert_description = (
        f"Increase green duration for mainline flow. "
        f"Predicted +{delay_minutes} min delay if signal timing is not "
        f"adjusted immediately."
    )

    return {
        "recommendationId": f"REC-{uuid.uuid4().hex[:8].upper()}",
        "createdAt": now_iso(),
        "status": "PENDING",
        "targetLocationName": location_name,
        "targetIntersectionId": intersection_id,
        "targetApproach": approach,
        "alertTitle": alert_title,
        "alertDescription": alert_description,
        "predictedDelayIfNoActionMinutes": delay_minutes,
        "currentGreenSeconds": current_green,
        "recommendedGreenSeconds": recommended_green,
        "deltaSeconds": actual_delta,
        "confidencePercent": confidence_percent,
    }
