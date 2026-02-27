from __future__ import annotations

from typing import List, Tuple

# (tick_index, volume) history type alias
History = List[Tuple[int, int]]


def persistence(history: History, horizon_ticks: int) -> int:
    """
    Persistence (naïve) forecast: the predicted value equals the most recent
    observed value, regardless of the horizon.

    Parameters
    ----------
    history : list of (tick_index, volume)
        Observed volume history, ordered oldest-first.  Must not be empty.
    horizon_ticks : int
        How many ticks ahead to forecast (unused by persistence but kept for
        a consistent interface).

    Returns
    -------
    int
        Predicted volume.
    """
    if not history:
        return 0
    return history[-1][1]


def seasonal_naive(
    history: History,
    horizon_ticks: int,
    seasonal_ticks: int = 10_080,
) -> int:
    """
    Seasonal naïve forecast: the predicted value is taken from the observation
    exactly *seasonal_ticks* ticks before the forecast target tick.

    ``forecast_tick = last_tick + horizon_ticks``
    ``target_lag    = forecast_tick - seasonal_ticks``

    The function searches *history* for the entry whose tick_index is closest
    to *target_lag*.  If the history is too short to reach the seasonal lag,
    it falls back to :func:`persistence`.

    Parameters
    ----------
    history : list of (tick_index, volume)
        Observed volume history, ordered oldest-first.  Must not be empty.
    horizon_ticks : int
        How many ticks ahead to forecast.
    seasonal_ticks : int
        Season length in ticks.  Default is 10 080 = 7 days × 24 h × 60 min
        (assumes 1-minute ticks / ``SIM_MINUTES_PER_TICK = 1``).

    Returns
    -------
    int
        Predicted volume.
    """
    if not history:
        return 0

    last_tick = history[-1][0]
    target_lag = last_tick + horizon_ticks - seasonal_ticks

    # Fall back to persistence when history doesn't reach the seasonal lag
    if target_lag < history[0][0]:
        return persistence(history, horizon_ticks)

    # Find the history entry closest to target_lag
    best_volume = history[0][1]
    best_dist = abs(history[0][0] - target_lag)

    for tick_idx, volume in history:
        dist = abs(tick_idx - target_lag)
        if dist < best_dist:
            best_dist = dist
            best_volume = volume
        if tick_idx > target_lag and dist > best_dist:
            # History is ordered; once we've passed target_lag and distance
            # is growing again we can stop early.
            break

    return best_volume
