from __future__ import annotations

import math
import random
from typing import Dict

from sim.config import LANES

# ---------------------------------------------------------------------------
# Base arrival rates (vehicles / tick at peak) — scaled by lane count
# N and S are mainline (3 lanes each), E and W are minor (2 lanes each)
# ---------------------------------------------------------------------------
_BASE_PEAK_ARRIVALS: Dict[str, float] = {
    "N": 28.0,
    "E": 14.0,
    "S": 28.0,
    "W": 14.0,
}

# Off-peak fraction of peak demand
_OFF_PEAK_FRACTION = 0.35

# Ticks over which demand ramps up to peak (120 ticks = 2 simulated hours)
_RAMP_TICKS = 120

# Noise as a fraction of the current demand (±)
_NOISE_FRACTION = 0.12


class DemandProfile:
    """
    Rush-hour demand ramp that produces integer vehicle arrivals per approach
    per tick.

    Demand rises from _OFF_PEAK_FRACTION × peak at tick 0 to full peak by
    tick _RAMP_TICKS using a smooth sigmoid-like (raised cosine) curve, then
    stays at peak.  A small Gaussian jitter is applied for realism.
    """

    def __init__(self, seed: int = 42) -> None:
        self._rng = random.Random(seed)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_arrivals(self, tick: int) -> Dict[str, int]:
        """
        Return a dict of approach -> integer arrivals for the given tick.

        Parameters
        ----------
        tick : int
            Zero-based simulation tick counter.
        """
        ramp = self._ramp_factor(tick)
        arrivals: Dict[str, int] = {}
        for approach, peak in _BASE_PEAK_ARRIVALS.items():
            mean = _OFF_PEAK_FRACTION * peak + ramp * (1.0 - _OFF_PEAK_FRACTION) * peak
            noise = self._rng.gauss(0.0, _NOISE_FRACTION * mean)
            raw = mean + noise
            arrivals[approach] = max(0, round(raw))
        return arrivals

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _ramp_factor(tick: int) -> float:
        """
        Smooth ramp from 0.0 → 1.0 over [0, _RAMP_TICKS] using a
        raised cosine (ease-in-out) curve, then held at 1.0.
        """
        if tick <= 0:
            return 0.0
        if tick >= _RAMP_TICKS:
            return 1.0
        # Raised cosine: 0.5 * (1 - cos(π * t/T))
        return 0.5 * (1.0 - math.cos(math.pi * tick / _RAMP_TICKS))
