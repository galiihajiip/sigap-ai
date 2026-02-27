from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class WeatherNow:
    tempC: float
    condition: str          # "Rain" | "Cloudy" | "Hot" | "Clear"
    desc: str               # human-readable Indonesian description
    updatedAt: str          # WIB ISO string
    provider: str           # e.g. "BMKG"


@dataclass
class ForecastItem:
    localDatetime: str              # e.g. "2026-02-27 08:00:00"
    tempC: float
    cloudCoverPercent: Optional[float]
    descId: str                     # BMKG weather_desc (Indonesian)
    descEn: Optional[str]           # BMKG weather_desc_en (English, may be absent)
