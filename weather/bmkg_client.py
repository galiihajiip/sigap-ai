from __future__ import annotations

import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import httpx

from core.config import (
    BMKG_ADM4_DEFAULT,
    BMKG_FORECAST_URL,
    DEFAULT_WEATHER_CONDITION,
    DEFAULT_WEATHER_DESC,
    DEFAULT_WEATHER_TEMP_C,
    TIMEZONE_NAME,
    WEATHER_REFRESH_SECONDS,
)
from core.time_utils import wib_now_iso
from weather.models import ForecastItem, WeatherNow

try:
    from zoneinfo import ZoneInfo
except ImportError:  # Python < 3.9
    from backports.zoneinfo import ZoneInfo  # type: ignore

_WIB = ZoneInfo(TIMEZONE_NAME)

# ---------------------------------------------------------------------------
# In-memory cache: adm4 -> (last_fetch_epoch, list[ForecastItem])
# ---------------------------------------------------------------------------
_cache: Dict[str, Tuple[float, List[ForecastItem]]] = {}


# ---------------------------------------------------------------------------
# Condition classifier
# ---------------------------------------------------------------------------

def _classify_condition(desc_id: str, cloud_cover: Optional[float], temp_c: float) -> str:
    """
    Map BMKG forecast fields to one of: "Rain", "Cloudy", "Hot", "Clear".
    """
    if "hujan" in desc_id.lower():
        return "Rain"
    if cloud_cover is not None and cloud_cover >= 60:
        return "Cloudy"
    if temp_c >= 32 and cloud_cover is not None and cloud_cover < 40:
        return "Hot"
    return "Clear"


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

def _parse_response(data: dict) -> List[ForecastItem]:
    """
    Parse the BMKG Open Data response into a flat list of ForecastItem.

    The BMKG API returns a nested structure like:
    {
      "data": [
        {
          "lokasi": {...},
          "cuaca": [
            [
              {
                "local_datetime": "2026-02-27 08:00:00",
                "t": 31,
                "tcc": 75,
                "weather_desc": "Hujan Ringan",
                "weather_desc_en": "Light Rain"
              },
              ...
            ]
          ]
        }
      ]
    }
    """
    items: List[ForecastItem] = []
    try:
        for location_block in data.get("data", []):
            for day_list in location_block.get("cuaca", []):
                for entry in day_list:
                    local_dt = str(entry.get("local_datetime", ""))
                    temp = float(entry.get("t", DEFAULT_WEATHER_TEMP_C))
                    tcc_raw = entry.get("tcc")
                    cloud = float(tcc_raw) if tcc_raw is not None else None
                    desc_id = str(entry.get("weather_desc", DEFAULT_WEATHER_DESC))
                    desc_en = entry.get("weather_desc_en")
                    items.append(
                        ForecastItem(
                            localDatetime=local_dt,
                            tempC=temp,
                            cloudCoverPercent=cloud,
                            descId=desc_id,
                            descEn=str(desc_en) if desc_en else None,
                        )
                    )
    except Exception:
        pass
    return items


# ---------------------------------------------------------------------------
# Cache-aware fetch
# ---------------------------------------------------------------------------

def fetch_bmkg_forecast(adm4: str = BMKG_ADM4_DEFAULT) -> List[ForecastItem]:
    """
    Fetch the BMKG forecast for *adm4*, using the in-memory cache.

    Returns the cached result if the last fetch was within
    WEATHER_REFRESH_SECONDS; otherwise makes a live HTTP GET.

    Parameters
    ----------
    adm4 : str
        BMKG administrative level-4 code, e.g. "35.78.22.1001".

    Returns
    -------
    list[ForecastItem]
        Parsed forecast items (may be empty on network error).
    """
    now_epoch = time.time()
    cached = _cache.get(adm4)
    if cached is not None:
        last_epoch, items = cached
        if now_epoch - last_epoch < WEATHER_REFRESH_SECONDS:
            return items

    try:
        resp = httpx.get(
            BMKG_FORECAST_URL,
            params={"adm4": adm4},
            timeout=10.0,
        )
        resp.raise_for_status()
        items = _parse_response(resp.json())
    except Exception:
        # Return previously cached data if available, else empty list
        items = cached[1] if cached else []

    _cache[adm4] = (now_epoch, items)
    return items


# ---------------------------------------------------------------------------
# "Current" selector
# ---------------------------------------------------------------------------

def _parse_local_datetime(s: str) -> Optional[datetime]:
    """Parse BMKG local_datetime string to a WIB-aware datetime."""
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(s, fmt).replace(tzinfo=_WIB)
        except ValueError:
            continue
    return None


def get_current_weather(adm4: str = BMKG_ADM4_DEFAULT) -> WeatherNow:
    """
    Return a WeatherNow representing the closest upcoming forecast relative
    to the current WIB time.  Falls back to static defaults on any error.

    Parameters
    ----------
    adm4 : str
        BMKG administrative level-4 code.

    Returns
    -------
    WeatherNow
    """
    items = fetch_bmkg_forecast(adm4)

    if not items:
        return _static_fallback()

    now_wib = datetime.now(_WIB)

    # Pick the item whose localDatetime is closest to now (preferring >= now)
    best: Optional[ForecastItem] = None
    best_delta: Optional[float] = None

    for item in items:
        dt = _parse_local_datetime(item.localDatetime)
        if dt is None:
            continue
        delta = (dt - now_wib).total_seconds()
        if delta >= 0:
            # Future or current slot — prefer smallest positive delta
            if best_delta is None or delta < best_delta:
                best = item
                best_delta = delta

    # If no future slot found, use the last item
    if best is None:
        best = items[-1]

    condition = _classify_condition(
        best.descId, best.cloudCoverPercent, best.tempC
    )

    return WeatherNow(
        tempC=best.tempC,
        condition=condition,
        desc=best.descId,
        updatedAt=wib_now_iso(),
        provider="BMKG",
    )


def _static_fallback() -> WeatherNow:
    return WeatherNow(
        tempC=DEFAULT_WEATHER_TEMP_C,
        condition=DEFAULT_WEATHER_CONDITION,
        desc=DEFAULT_WEATHER_DESC,
        updatedAt=wib_now_iso(),
        provider="STATIC",
    )
