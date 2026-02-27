from core.config import CYCLE_SECONDS, SIM_MINUTES_PER_TICK

# Number of lanes per approach
LANES: dict[str, int] = {"N": 3, "E": 2, "S": 3, "W": 2}

# Saturation flow rate per lane (Highway Capacity Manual typical value)
SAT_FLOW_VEH_PER_HOUR_PER_LANE: int = 1900

# ---------------------------------------------------------------------------
# Derived helpers
# ---------------------------------------------------------------------------

def sat_flow_per_tick(lanes: int) -> float:
    """
    Maximum vehicles that can depart through `lanes` lanes in one simulation
    tick (SIM_MINUTES_PER_TICK minutes) assuming saturation flow.

    sat_flow_per_tick = SAT_FLOW * lanes / 60 * SIM_MINUTES_PER_TICK
    """
    return SAT_FLOW_VEH_PER_HOUR_PER_LANE * lanes / 60.0 * SIM_MINUTES_PER_TICK


def green_ratio(green_seconds: int) -> float:
    """
    Effective green ratio (g/C) for a given green phase duration.

    green_ratio = green_seconds / CYCLE_SECONDS
    """
    return green_seconds / CYCLE_SECONDS


def effective_flow_per_tick(approach: str, green_seconds: int) -> float:
    """
    Expected vehicle throughput per tick for an approach given its green phase.

    throughput = sat_flow_per_tick * green_ratio
    """
    lanes = LANES.get(approach, 1)
    return sat_flow_per_tick(lanes) * green_ratio(green_seconds)
