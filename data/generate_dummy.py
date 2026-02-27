"""
data/generate_dummy.py
----------------------
Generates a realistic synthetic traffic dataset for Sigap AI.

Run from the project root:
    python data/generate_dummy.py

Output:
  data/dummy_traffic_7d.csv  —  7 days,  40 320 rows (10 080 ticks × 4 approaches)
  data/dummy_traffic_1d.csv  —  2 days,  11 520 rows (  2 880 ticks × 4 approaches)

Both files exceed 10 000 rows as required.
"""

from __future__ import annotations

import math
import os
import sys
import random
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Allow running as a script from any cwd
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from core.data_config import (
    BASE_DEMAND_PEAK,
    OFF_PEAK_FRACTION,
    NOISE_FRACTION,
    SPEED_NOISE_STD_KMH,
    DENSITY_NOISE_STD_PCT,
    ACCIDENT_PROB_PER_TICK,
    ACCIDENT_DURATION_TICKS,
    ACCIDENT_CAPACITY_MULTIPLIER,
    ROADWORK_PROB_PER_TICK,
    ROADWORK_DURATION_TICKS,
    ROADWORK_CAPACITY_MULTIPLIER,
    EVENT_PROB_PER_TICK,
    EVENT_DURATION_TICKS,
    EVENT_DEMAND_MULTIPLIER,
    WEATHER_DEMAND_MULTIPLIER,
    WEATHER_SPEED_REDUCTION_KMH,
    WEATHER_TEMP_RANGE_C,
    WEATHER_CONDITION_PROBS,
    WEATHER_MIN_PERSIST_TICKS,
    DEFAULT_SEED,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
WIB = ZoneInfo("Asia/Jakarta")
APPROACHES: list[str] = ["N", "E", "S", "W"]
INTERSECTION_ID = "SUR-4092"
LOCATION_NAME = "Jl. Soedirman, Surabaya"

# Simulation parameters
CYCLE_SECONDS = 90
MIN_GREEN = 20
MAX_GREEN = 70
V_FREE_KMH = 60.0          # free-flow speed
SAT_FLOW_VEH_PER_HOUR = 1900  # per lane per hour
LANES: dict[str, int] = {"N": 3, "E": 2, "S": 3, "W": 2}

# Weekend scaling
WEEKEND_FACTOR = 0.65

# Peak-hour windows (start_hour, peak_hour, end_hour, peak_fraction)
MORNING_PEAK = (6.0, 7.5, 9.0)   # fraction of 24-h
EVENING_PEAK = (16.0, 17.5, 19.0)

# Label horizons in ticks (1 tick = 1 minute)
HORIZON_15M = 15
HORIZON_2H = 120
HORIZON_4H = 240

# 7 days × 24 h × 60 min ticks
TICKS_7D = 7 * 24 * 60     # 10 080
TICKS_2D = 2 * 24 * 60     # 2 880  → 11 520 rows with 4 approaches


# ---------------------------------------------------------------------------
# Helper: smooth trapezoidal bell for demand (raised cosine shape)
# ---------------------------------------------------------------------------
def _raised_cos(x: float, x_start: float, x_peak: float, x_end: float) -> float:
    """Return 0..1 weight using a raised-cosine shape centred at x_peak."""
    if x <= x_start or x >= x_end:
        return 0.0
    if x <= x_peak:
        half = x_peak - x_start
        if half == 0:
            return 1.0
        return 0.5 * (1 - math.cos(math.pi * (x - x_start) / half))
    else:
        half = x_end - x_peak
        if half == 0:
            return 1.0
        return 0.5 * (1 + math.cos(math.pi * (x - x_peak) / half))


def time_of_day_factor(hour_frac: float, is_weekend: bool) -> float:
    """
    Return a demand multiplier in [OFF_PEAK_FRACTION, 1.0].
    hour_frac: hour + minute/60 (0.0 – 24.0)
    """
    morning = _raised_cos(hour_frac, MORNING_PEAK[0], MORNING_PEAK[1], MORNING_PEAK[2])
    evening = _raised_cos(hour_frac, EVENING_PEAK[0], EVENING_PEAK[1], EVENING_PEAK[2])
    peak_weight = max(morning, evening)
    base = OFF_PEAK_FRACTION + (1.0 - OFF_PEAK_FRACTION) * peak_weight
    if is_weekend:
        base *= WEEKEND_FACTOR
    return base


# ---------------------------------------------------------------------------
# Weather state machine
# ---------------------------------------------------------------------------

class WeatherState:
    CONDITIONS = list(WEATHER_CONDITION_PROBS.keys())
    PROBS = [WEATHER_CONDITION_PROBS[c] for c in CONDITIONS]

    def __init__(self, rng: random.Random):
        self._rng = rng
        self._condition: str = self._rng.choices(self.CONDITIONS, weights=self.PROBS, k=1)[0]
        self._ticks_remaining: int = self._rng.randint(
            WEATHER_MIN_PERSIST_TICKS,
            WEATHER_MIN_PERSIST_TICKS * 4,
        )
        low, high = WEATHER_TEMP_RANGE_C[self._condition]
        self._temp_c: float = self._rng.uniform(low, high)

    @property
    def condition(self) -> str:
        return self._condition

    @property
    def temp_c(self) -> float:
        return round(self._temp_c, 1)

    def step(self) -> None:
        self._ticks_remaining -= 1
        if self._ticks_remaining <= 0:
            self._condition = self._rng.choices(self.CONDITIONS, weights=self.PROBS, k=1)[0]
            self._ticks_remaining = self._rng.randint(
                WEATHER_MIN_PERSIST_TICKS,
                WEATHER_MIN_PERSIST_TICKS * 6,
            )
            low, high = WEATHER_TEMP_RANGE_C[self._condition]
            self._temp_c = self._rng.uniform(low, high)
        else:
            # Small temperature drift
            low, high = WEATHER_TEMP_RANGE_C[self._condition]
            noise = self._rng.gauss(0, 0.2)
            self._temp_c = max(low, min(high, self._temp_c + noise))


# ---------------------------------------------------------------------------
# Incident trackers
# ---------------------------------------------------------------------------

class IncidentTracker:
    def __init__(self, prob_per_tick: float, duration_ticks: int,
                 capacity_mult: float, rng: random.Random):
        self._prob = prob_per_tick
        self._duration = duration_ticks
        self._capacity_mult = capacity_mult
        self._rng = rng
        self._remaining: int = 0

    @property
    def active(self) -> bool:
        return self._remaining > 0

    @property
    def capacity_multiplier(self) -> float:
        return self._capacity_mult if self.active else 1.0

    def step(self) -> None:
        if self._remaining > 0:
            self._remaining -= 1
        elif self._rng.random() < self._prob:
            # Randomise duration slightly
            self._remaining = self._rng.randint(
                max(1, self._duration // 2),
                self._duration,
            )


# ---------------------------------------------------------------------------
# Queue dynamics (per approach)
# ---------------------------------------------------------------------------

def sat_flow_per_tick(approach: str) -> float:
    """Max vehicles departing per 1-min tick given saturation flow and green."""
    lanes = LANES[approach]
    return SAT_FLOW_VEH_PER_HOUR * lanes / 60.0  # veh/min at saturation


def alloc_green(demand: dict[str, float]) -> dict[str, int]:
    """Proportional green allocation within [MIN_GREEN, MAX_GREEN]."""
    total = sum(demand.values()) or 1.0
    greens: dict[str, int] = {}
    for ap, d in demand.items():
        raw = int(round(CYCLE_SECONDS * (d / total)))
        greens[ap] = max(MIN_GREEN, min(MAX_GREEN, raw))
    return greens


# ---------------------------------------------------------------------------
# Speed model (Greenshields linear)
# ---------------------------------------------------------------------------

def compute_speed(density_pct: float, weather_condition: str, rng: random.Random) -> float:
    v = V_FREE_KMH * (1.0 - density_pct / 100.0)
    v -= WEATHER_SPEED_REDUCTION_KMH.get(weather_condition, 0.0)
    v += rng.gauss(0, SPEED_NOISE_STD_KMH)
    return round(max(10.0, min(V_FREE_KMH, v)), 2)


# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------

def generate(
    total_ticks: int,
    seed: int = DEFAULT_SEED,
    start_dt: datetime | None = None,
) -> pd.DataFrame:
    """
    Generate a synthetic traffic dataset.

    Parameters
    ----------
    total_ticks : int
        Number of 1-minute ticks to simulate.
    seed : int
        RNG seed for reproducibility.
    start_dt : datetime, optional
        Simulation start time (WIB-aware).  Defaults to last Monday 00:00 WIB.

    Returns
    -------
    pd.DataFrame with one row per (tick, approach).
    """
    rng = random.Random(seed)
    np_rng = np.random.default_rng(seed)

    if start_dt is None:
        # Use a fixed reference Monday so weekday pattern is deterministic
        start_dt = datetime(2026, 2, 23, 0, 0, 0, tzinfo=WIB)  # Monday

    # ------------------------------------------------------------------
    # Shared state (intersection-level)
    # ------------------------------------------------------------------
    weather = WeatherState(rng)
    accident = IncidentTracker(
        ACCIDENT_PROB_PER_TICK, ACCIDENT_DURATION_TICKS,
        ACCIDENT_CAPACITY_MULTIPLIER, rng,
    )
    roadwork = IncidentTracker(
        ROADWORK_PROB_PER_TICK, ROADWORK_DURATION_TICKS,
        ROADWORK_CAPACITY_MULTIPLIER, rng,
    )
    event = IncidentTracker(
        EVENT_PROB_PER_TICK, EVENT_DURATION_TICKS,
        1.0, rng,  # events don't reduce capacity
    )

    # Per-approach queue (vehicles)
    queues: dict[str, float] = {ap: 0.0 for ap in APPROACHES}

    rows: list[dict] = []

    for tick in range(total_ticks):
        dt = start_dt + timedelta(minutes=tick)
        hour_frac = dt.hour + dt.minute / 60.0
        is_weekend = dt.weekday() >= 5  # Sat=5, Sun=6

        tod_factor = time_of_day_factor(hour_frac, is_weekend)

        # ---------- step shared incident trackers ----------
        weather.step()
        accident.step()
        roadwork.step()
        event.step()

        cond = weather.condition
        temp_c = weather.temp_c
        wdm = WEATHER_DEMAND_MULTIPLIER.get(cond, 1.0)
        capacity_mult = accident.capacity_multiplier * roadwork.capacity_multiplier
        event_mult = EVENT_DEMAND_MULTIPLIER if event.active else 1.0

        # ---------- compute per-approach demand this tick ----------
        raw_demand: dict[str, float] = {}
        for ap in APPROACHES:
            peak = BASE_DEMAND_PEAK[ap]
            mean = peak * tod_factor * wdm * event_mult
            noise_std = mean * NOISE_FRACTION
            noise_std = max(noise_std, 0.5)  # floor so we always get some variance
            arrivals = max(0.0, np_rng.normal(mean, noise_std))
            raw_demand[ap] = arrivals

        greens = alloc_green(raw_demand)

        # ---------- per-approach metrics ----------
        for ap in APPROACHES:
            arrivals = raw_demand[ap]
            green_s = greens[ap]

            # Effective capacity per tick (veh/min), reduced by incidents
            cap_per_tick = sat_flow_per_tick(ap) * (green_s / CYCLE_SECONDS) * capacity_mult

            # Queue update
            q = queues[ap]
            q += arrivals
            departures = min(q, cap_per_tick)
            q -= departures
            queues[ap] = max(0.0, q)

            queue_int = int(math.ceil(queues[ap]))

            # Capacity for density: SAT_FLOW at full green × lanes
            max_queue = SAT_FLOW_VEH_PER_HOUR * LANES[ap] / 60.0 * 2  # ~2 min buffer
            density_pct = min(100.0, (queues[ap] / max(max_queue, 1)) * 100.0)
            density_pct += np_rng.normal(0, DENSITY_NOISE_STD_PCT)
            density_pct = round(max(0.0, min(100.0, density_pct)), 2)

            speed = compute_speed(density_pct, cond, rng)

            # Wait time (Little's law approximation): W = Q / departures_rate
            dep_rate = max(departures, 0.1)  # veh/min
            wait_min = round(queues[ap] / dep_rate, 3)

            volume_vph = round(arrivals * 60.0, 2)

            rows.append(
                {
                    "timestamp_wib":       dt.isoformat(),
                    "tick":                tick,
                    "intersectionId":      INTERSECTION_ID,
                    "approach":            ap,
                    "vehicle_count_1min":  int(round(arrivals)),
                    "volume_veh_per_hour": volume_vph,
                    "avg_speed_kmh":       speed,
                    "queue_length_veh":    queue_int,
                    "wait_time_min":       min(wait_min, 60.0),
                    "green_seconds":       green_s,
                    "density_percent":     density_pct,
                    "weather_condition":   cond,
                    "weather_temp_c":      temp_c,
                    "accident_count":      int(accident.active),
                    "roadwork_flag":       int(roadwork.active),
                    "event_flag":          int(event.active),
                    # labels filled in next pass
                    "target_volume_15m":   None,
                    "target_volume_2h":    None,
                    "target_volume_4h":    None,
                }
            )

    df = pd.DataFrame(rows)

    # ------------------------------------------------------------------
    # Build labels: future volume_veh_per_hour per (intersectionId, approach)
    # ------------------------------------------------------------------
    for ap in APPROACHES:
        mask = df["approach"] == ap
        sub = df.loc[mask, "volume_veh_per_hour"].reset_index(drop=True)

        df.loc[mask, "target_volume_15m"] = (
            sub.shift(-HORIZON_15M).ffill().values
        )
        df.loc[mask, "target_volume_2h"] = (
            sub.shift(-HORIZON_2H).ffill().values
        )
        df.loc[mask, "target_volume_4h"] = (
            sub.shift(-HORIZON_4H).ffill().values
        )

    # Round label columns
    for col in ("target_volume_15m", "target_volume_2h", "target_volume_4h"):
        df[col] = df[col].round(2)

    return df


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    out_dir = _HERE
    os.makedirs(out_dir, exist_ok=True)

    print(f"Generating {TICKS_7D}-tick (7-day) dataset …")
    df_7d = generate(total_ticks=TICKS_7D, seed=DEFAULT_SEED)
    path_7d = os.path.join(out_dir, "dummy_traffic_7d.csv")
    df_7d.to_csv(path_7d, index=False)
    print(f"  Saved {len(df_7d):,} rows → {path_7d}")

    print(f"Generating {TICKS_2D}-tick (2-day) dataset …")
    df_2d = generate(total_ticks=TICKS_2D, seed=DEFAULT_SEED)
    path_2d = os.path.join(out_dir, "dummy_traffic_1d.csv")
    df_2d.to_csv(path_2d, index=False)
    print(f"  Saved {len(df_2d):,} rows → {path_2d}")

    # Quick sanity checks
    for name, df in [("7d", df_7d), ("2d", df_2d)]:
        assert len(df) >= 10_000, f"{name}: only {len(df)} rows!"
        assert df["vehicle_count_1min"].min() >= 0, f"{name}: negative arrivals!"
        assert df["density_percent"].between(0, 100).all(), f"{name}: density out of range!"
        print(
            f"  [{name}] rows={len(df):,}  "
            f"approaches={df['approach'].nunique()}  "
            f"weather_conditions={df['weather_condition'].unique().tolist()}"
        )

    print("Done.")


if __name__ == "__main__":
    main()
