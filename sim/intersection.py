from __future__ import annotations

from typing import Dict

from core.config import (
    CLEARANCE_SECONDS,
    CONGESTION_ALERT_CAPACITY_PERCENT,
    CYCLE_SECONDS,
    DEFAULT_GREEN_SECONDS,
    DEFAULT_WEATHER_CONDITION,
    DEFAULT_WEATHER_TEMP_C,
    SIM_MINUTES_PER_TICK,
)
from core.time_utils import wib_now_iso
from sim.config import LANES, SAT_FLOW_VEH_PER_HOUR_PER_LANE
from sim.controller import SignalController
from sim.demand import DemandProfile

# Maximum queue depth per approach used for density normalisation
_MAX_QUEUE_PER_APPROACH = 80  # vehicles
_QUEUE_HARD_CAP_PER_APPROACH = 120

# Approaches
_APPROACHES = ["N", "E", "S", "W"]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _service_capacity(approach: str, green_seconds: int) -> float:
    """
    Maximum vehicles that can depart through *approach* in one tick.

    capacity = SAT_FLOW * lanes * (green / CYCLE) * SIM_MINUTES_PER_TICK / 60
    """
    lanes = LANES.get(approach, 1)
    green_ratio = green_seconds / CYCLE_SECONDS
    # SAT_FLOW is veh/hour/lane → convert to veh/tick
    return SAT_FLOW_VEH_PER_HOUR_PER_LANE * lanes * green_ratio * SIM_MINUTES_PER_TICK / 60.0


def _density_to_speed(density_percent: float) -> float:
    """
    Greenshields-inspired speed ~ freeflow * (1 - density/100).

    Maps 0 % → 60 km/h, 100 % → 10 km/h linearly.
    """
    free_flow = 60.0
    jam_speed = 10.0
    return max(jam_speed, free_flow - (free_flow - jam_speed) * (density_percent / 100.0))


# ---------------------------------------------------------------------------
# IntersectionSim
# ---------------------------------------------------------------------------

class IntersectionSim:
    """
    Single-intersection simulation.

    Queue dynamics guarantee that extending the green on approach *S* (or any
    approach) drains its queue faster than arrivals accumulate, so total queue
    falls within 5–10 ticks.
    """

    def __init__(
        self,
        intersection_id: str = "SUR-4092",
        seed: int = 42,
    ) -> None:
        self.intersection_id = intersection_id
        self._controller = SignalController()
        self._demand = DemandProfile(seed=seed)

        # Per-approach queue (vehicles waiting)
        self._queue: Dict[str, int] = {a: 0 for a in _APPROACHES}

        # Cumulative counters — reset each tick for snapshot
        self._total_arrivals_this_tick: int = 0
        self._total_departures_this_tick: int = 0

        # Stable weather — injected externally, not randomised per tick
        self._weather_temp_c: float = DEFAULT_WEATHER_TEMP_C
        self._weather_condition: str = DEFAULT_WEATHER_CONDITION

    # ------------------------------------------------------------------
    # Controller proxy
    # ------------------------------------------------------------------

    @property
    def controller(self) -> SignalController:
        return self._controller

    # ------------------------------------------------------------------
    # Simulation step
    # ------------------------------------------------------------------

    def set_weather(self, temp_c: float, condition: str) -> None:
        """Inject stable weather readings (called by tick loop at most every WEATHER_REFRESH_SECONDS)."""
        self._weather_temp_c = temp_c
        self._weather_condition = condition

    def step(self, tick: int) -> dict:
        """
        Advance simulation by one tick and return a metrics snapshot dict
        compatible with the LiveMetrics schema.
        """
        arrivals = self._demand.get_arrivals(tick)
        plan = self._controller.get_plan()

        total_arrivals = 0
        total_departures = 0

        for approach in _APPROACHES:
            green_s = plan[approach]["greenSeconds"]
            capacity = _service_capacity(approach, green_s)

            arr = arrivals[approach]
            demand = self._queue[approach] + arr
            dep = int(min(demand, capacity))

            self._queue[approach] = min(_QUEUE_HARD_CAP_PER_APPROACH, max(0, demand - dep))
            total_arrivals += arr
            total_departures += dep

        self._total_arrivals_this_tick = total_arrivals
        self._total_departures_this_tick = total_departures

        return self._build_snapshot()

    # ------------------------------------------------------------------
    # State mutations (called externally by AI / human actions)
    # ------------------------------------------------------------------

    def apply_adjustment(self, approach: str, delta_seconds: int) -> dict:
        """Apply a green-phase adjustment and return the new signal plan."""
        return self._controller.apply_adjustment(approach, delta_seconds)

    def revert_baseline(self) -> dict:
        return self._controller.revert_baseline()

    # ------------------------------------------------------------------
    # Snapshot builder
    # ------------------------------------------------------------------

    def _build_snapshot(self) -> dict:
        total_queue = sum(self._queue.values())
        max_total_queue = _MAX_QUEUE_PER_APPROACH * len(_APPROACHES)

        density_percent = min(100.0, total_queue / max_total_queue * 100.0)
        avg_speed = _density_to_speed(density_percent)

        # currentVolume: scale arrivals to vehicles-per-cycle for UI display
        ticks_per_cycle = max(1, CYCLE_SECONDS // (SIM_MINUTES_PER_TICK * 60))
        current_volume = self._total_arrivals_this_tick * ticks_per_cycle

        # Wait time: queued vehicles / departure rate (min)
        departure_rate_per_min = max(
            1.0, self._total_departures_this_tick / SIM_MINUTES_PER_TICK
        )
        wait_time_minutes = total_queue / departure_rate_per_min

        # Flow rate: arrivals per sim-minute
        flow_rate = self._total_arrivals_this_tick / SIM_MINUTES_PER_TICK

        return {
            "timestamp": wib_now_iso(),
            "currentVolume": current_volume,
            "avgSpeedKmh": round(avg_speed, 1),
            "queueLengthVehicles": total_queue,
            "waitTimeMinutes": round(wait_time_minutes, 2),
            "weatherTempC": self._weather_temp_c,
            "weatherCondition": self._weather_condition,
            "accidentsCount": 0,
            "flowRateCarsPerMin": round(flow_rate, 2),
            "densityPercent": round(density_percent, 1),
        }

    # ------------------------------------------------------------------
    # Read-only helpers
    # ------------------------------------------------------------------

    def get_queue(self) -> Dict[str, int]:
        return dict(self._queue)

    def get_total_queue(self) -> int:
        return sum(self._queue.values())
