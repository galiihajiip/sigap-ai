from __future__ import annotations

import threading
import time
from typing import Dict, Optional, Tuple

from core.config import (
    BMKG_ADM4_DEFAULT,
    DEFAULT_WEATHER_CONDITION,
    DEFAULT_WEATHER_DESC,
    DEFAULT_WEATHER_TEMP_C,
    WEATHER_REFRESH_SECONDS,
)
from core.time_utils import wib_now_iso
from weather.bmkg_client import get_current_weather
from weather.models import WeatherNow

# ---------------------------------------------------------------------------
# Internal cache
# Per location_key: (last_refresh_epoch, WeatherNow)
# ---------------------------------------------------------------------------
_lock = threading.Lock()
_service_cache: Dict[str, Tuple[float, WeatherNow]] = {}


# ---------------------------------------------------------------------------
# Fallback constructor
# ---------------------------------------------------------------------------

def _static_default() -> WeatherNow:
    return WeatherNow(
        tempC=DEFAULT_WEATHER_TEMP_C,
        condition=DEFAULT_WEATHER_CONDITION,
        desc=DEFAULT_WEATHER_DESC,
        updatedAt=wib_now_iso(),
        provider="STATIC",
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_weather_now(
    location_key: str = "default",
    adm4: Optional[str] = None,
) -> WeatherNow:
    """
    Return stable WeatherNow for *location_key*.

    - Weather is **only refreshed** when:
      1. No cached value exists yet, OR
      2. WEATHER_REFRESH_SECONDS have elapsed since the last refresh.
    - This means weather stays constant across 2-second ticks and only
      updates at most every 10 minutes.
    - On BMKG failure the last known value is returned; if no prior value
      exists the DEFAULT_WEATHER_* constants are used.

    Parameters
    ----------
    location_key : str
        Arbitrary cache key (e.g. intersection ID or "default").
    adm4 : str | None
        BMKG administrative level-4 code.  Falls back to BMKG_ADM4_DEFAULT.

    Returns
    -------
    WeatherNow
    """
    resolved_adm4 = adm4 or BMKG_ADM4_DEFAULT
    now_epoch = time.monotonic()

    with _lock:
        cached = _service_cache.get(location_key)

        # Return cached value if still fresh
        if cached is not None:
            last_epoch, last_weather = cached
            if now_epoch - last_epoch < WEATHER_REFRESH_SECONDS:
                return last_weather

    # Outside the lock: perform the potentially slow BMKG call
    try:
        weather = get_current_weather(adm4=resolved_adm4)
    except Exception:
        weather = None

    with _lock:
        # Re-check: another thread may have refreshed while we were fetching
        cached = _service_cache.get(location_key)
        if cached is not None:
            last_epoch, last_weather = cached
            if now_epoch - last_epoch < WEATHER_REFRESH_SECONDS:
                return last_weather

        if weather is not None:
            # Stamp updatedAt with current WIB time
            weather = WeatherNow(
                tempC=weather.tempC,
                condition=weather.condition,
                desc=weather.desc,
                updatedAt=wib_now_iso(),
                provider=weather.provider,
            )
            _service_cache[location_key] = (now_epoch, weather)
            return weather

        # BMKG failed — return last known or static default
        if cached is not None:
            return cached[1]

        fallback = _static_default()
        _service_cache[location_key] = (now_epoch, fallback)
        return fallback


def invalidate(location_key: str | None = None) -> None:
    """
    Force a refresh on the next call.

    Parameters
    ----------
    location_key : str | None
        If given, invalidate only that key; if None, clear all cached entries.
    """
    with _lock:
        if location_key is None:
            _service_cache.clear()
        else:
            _service_cache.pop(location_key, None)
