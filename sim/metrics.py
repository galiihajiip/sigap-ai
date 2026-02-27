from __future__ import annotations

from core.config import SIM_MINUTES_PER_TICK

# Speed thresholds for flow labels (km/h)
_FREE_FLOW_MIN = 45.0
_MODERATE_FLOW_MIN = 25.0


def compute_density_percent(volume: float, capacity: float) -> float:
    """
    Return occupancy density as a percentage clamped to [0, 100].

    Parameters
    ----------
    volume : float
        Current number of vehicles (e.g. queue length or observed count).
    capacity : float
        Maximum number of vehicles that defines 100 % density.
    """
    if capacity <= 0:
        return 100.0
    return min(100.0, max(0.0, volume / capacity * 100.0))


def compute_speed_kmh(density_percent: float) -> float:
    """
    Estimate average speed using a Greenshields linear speed-density model.

    Maps:
      - 0 %   → 60 km/h  (free-flow)
      - 100 % → 10 km/h  (jam)

    Parameters
    ----------
    density_percent : float
        Density as a percentage [0, 100].
    """
    free_flow = 60.0
    jam_speed = 10.0
    d = max(0.0, min(100.0, density_percent))
    return round(free_flow - (free_flow - jam_speed) * (d / 100.0), 1)


def compute_wait_time(queue: int, departures_per_tick: float) -> float:
    """
    Estimate average wait time in minutes.

    wait = queue / departure_rate  (in ticks) × SIM_MINUTES_PER_TICK

    Parameters
    ----------
    queue : int
        Total vehicles currently queued.
    departures_per_tick : float
        Vehicles discharged per simulation tick.
    """
    if departures_per_tick <= 0:
        # No capacity — use large but finite sentinel
        return round(queue * SIM_MINUTES_PER_TICK, 2)
    return round((queue / departures_per_tick) * SIM_MINUTES_PER_TICK, 2)


def compute_flow_label(speed_kmh: float) -> str:
    """
    Map average speed to a human-readable flow label matching UI values.

    - speed >= 45 km/h  → "Free Flow"
    - speed >= 25 km/h  → "Moderate Flow"
    - speed <  25 km/h  → "Slow Traffic"

    Parameters
    ----------
    speed_kmh : float
        Average vehicle speed in km/h.
    """
    if speed_kmh >= _FREE_FLOW_MIN:
        return "Free Flow"
    if speed_kmh >= _MODERATE_FLOW_MIN:
        return "Moderate Flow"
    return "Slow Traffic"
