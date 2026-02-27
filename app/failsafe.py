from __future__ import annotations

import time
from typing import Dict, Optional

from core.config import SENSOR_STALE_SECONDS
from app.state_store import store
from sim.controller import SignalController

# ---------------------------------------------------------------------------
# Per-intersection stale tracker: intersectionId -> last sensor epoch
# ---------------------------------------------------------------------------
_last_sensor_epoch: Dict[str, float] = {}


def record_sensor_tick(intersection_id: str) -> None:
    """
    Record that a live sensor reading was received for *intersection_id*.

    Call this once per simulation tick after a successful sim.step().
    """
    _last_sensor_epoch[intersection_id] = time.monotonic()


def check_failsafe(
    intersection_id: str,
    controller: SignalController,
) -> str:
    """
    Evaluate whether the sensor for *intersection_id* is stale.

    - If no reading has been received yet, or the last reading is older than
      SENSOR_STALE_SECONDS, the system is marked LOCAL_FALLBACK and the
      signal controller is reverted to its baseline plan.
    - Otherwise the mode is AI_ACTIVE.

    Parameters
    ----------
    intersection_id : str
        The intersection to check.
    controller : SignalController
        The signal controller for this intersection; reverted on stale.

    Returns
    -------
    str
        Either "AI_ACTIVE" or "LOCAL_FALLBACK".
    """
    last_epoch: Optional[float] = _last_sensor_epoch.get(intersection_id)
    now = time.monotonic()

    if last_epoch is None or (now - last_epoch) > SENSOR_STALE_SECONDS:
        # Sensor is stale — fallback
        controller.revert_baseline()
        store.update_system_status(
            mode="LOCAL_FALLBACK",
            systemOperational=True,
            message=(
                f"Sensor stale for '{intersection_id}' "
                f"(>{SENSOR_STALE_SECONDS}s). "
                "Reverted to baseline signal plan. "
                "Timezone: WIB (Asia/Jakarta)."
            ),
        )
        return "LOCAL_FALLBACK"

    # Sensor is fresh — ensure AI_ACTIVE mode
    store.update_system_status(
        mode="AI_ACTIVE",
        systemOperational=True,
    )
    return "AI_ACTIVE"


def check_all_failsafes(
    controllers: Dict[str, SignalController],
) -> Dict[str, str]:
    """
    Run :func:`check_failsafe` for every intersection in *controllers*.

    Parameters
    ----------
    controllers : dict[str, SignalController]
        Mapping of intersectionId -> SignalController.

    Returns
    -------
    dict[str, str]
        Mapping of intersectionId -> "AI_ACTIVE" | "LOCAL_FALLBACK".
    """
    return {
        iid: check_failsafe(iid, ctrl)
        for iid, ctrl in controllers.items()
    }
