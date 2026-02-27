"""
core/data_config.py
-------------------
Configuration constants for the synthetic dataset generator.
These values control demand shape, noise, incidents, weather sensitivity,
and feature engineering for ML training data.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Base demand (vehicles per tick per approach) at peak hour
# ---------------------------------------------------------------------------
BASE_DEMAND_PEAK: dict[str, float] = {
    "N": 28.0,
    "E": 14.0,
    "S": 28.0,
    "W": 14.0,
}

# Fraction of peak demand used as off-peak floor
OFF_PEAK_FRACTION: float = 0.35

# ---------------------------------------------------------------------------
# Rush-hour ramp
# ---------------------------------------------------------------------------
# Ticks over which demand ramps from off-peak to peak (raised cosine)
RAMP_DURATION_TICKS: int = 120           # 120 ticks = 2 simulated hours

# Second ramp window for evening peak (tick offset from sim start)
EVENING_PEAK_START_TICK: int = 480       # tick ~8 h after sim start
EVENING_PEAK_DURATION_TICKS: int = 90

# ---------------------------------------------------------------------------
# Noise
# ---------------------------------------------------------------------------
# Gaussian noise applied to demand:  std = NOISE_FRACTION × mean_demand
NOISE_FRACTION: float = 0.12

# Gaussian noise applied to speed (km/h)
SPEED_NOISE_STD_KMH: float = 2.0

# Gaussian noise applied to density (percent)
DENSITY_NOISE_STD_PCT: float = 1.5

# ---------------------------------------------------------------------------
# Incidents: accidents
# ---------------------------------------------------------------------------
# Probability that an accident starts in any given tick (per intersection)
ACCIDENT_PROB_PER_TICK: float = 1 / (60 * 8)   # ~1 per 8 simulated hours

# Duration of an accident in ticks
ACCIDENT_DURATION_TICKS: int = 15               # 15 sim-minutes

# Capacity multiplier when an accident is active (< 1 = capacity reduction)
ACCIDENT_CAPACITY_MULTIPLIER: float = 0.55       # 45 % capacity loss

# ---------------------------------------------------------------------------
# Incidents: roadwork
# ---------------------------------------------------------------------------
ROADWORK_PROB_PER_TICK: float = 1 / (60 * 24)  # ~1 per day
ROADWORK_DURATION_TICKS: int = 60               # 1 simulated hour
ROADWORK_CAPACITY_MULTIPLIER: float = 0.70       # 30 % capacity loss

# ---------------------------------------------------------------------------
# Events (demand spikes)
# ---------------------------------------------------------------------------
EVENT_PROB_PER_TICK: float = 1 / (60 * 48)     # ~1 per 2 simulated days
EVENT_DURATION_TICKS: int = 30                   # 30 sim-minutes
EVENT_DEMAND_MULTIPLIER: float = 1.40            # +40 % demand

# ---------------------------------------------------------------------------
# Weather sensitivity multipliers on demand (relative to Clear baseline = 1.0)
# ---------------------------------------------------------------------------
WEATHER_DEMAND_MULTIPLIER: dict[str, float] = {
    "Clear":  1.00,
    "Cloudy": 0.97,
    "Hot":    0.95,
    "Rain":   0.88,   # rain suppresses some discretionary trips
}

# Weather effect on speed (km/h reduction vs Clear)
WEATHER_SPEED_REDUCTION_KMH: dict[str, float] = {
    "Clear":  0.0,
    "Cloudy": 1.0,
    "Hot":    0.5,
    "Rain":   5.0,
}

# ---------------------------------------------------------------------------
# Temperature ranges per weather condition (for synthetic generation)
# ---------------------------------------------------------------------------
WEATHER_TEMP_RANGE_C: dict[str, tuple[float, float]] = {
    "Clear":  (29.0, 34.0),
    "Cloudy": (26.0, 30.0),
    "Hot":    (33.0, 38.0),
    "Rain":   (23.0, 28.0),
}

# Probability of each weather condition (must sum to ~1.0)
WEATHER_CONDITION_PROBS: dict[str, float] = {
    "Rain":   0.35,
    "Cloudy": 0.25,
    "Hot":    0.20,
    "Clear":  0.20,
}

# Minimum number of ticks a weather condition persists before it can change
WEATHER_MIN_PERSIST_TICKS: int = 30  # 30 sim-minutes

# ---------------------------------------------------------------------------
# Dataset generation totals
# ---------------------------------------------------------------------------
# Default number of ticks to generate for one full dataset
DEFAULT_DATASET_TICKS: int = 10_080   # 7 days × 24 h × 60 min

# Random seed for reproducible generation
DEFAULT_SEED: int = 42
