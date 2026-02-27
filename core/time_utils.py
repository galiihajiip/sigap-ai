from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from core.config import TIMEZONE_NAME

_WIB = ZoneInfo(TIMEZONE_NAME)  # Asia/Jakarta, UTC+7


# ---------------------------------------------------------------------------
# UTC helpers (used internally / for storage)
# ---------------------------------------------------------------------------

def now_iso() -> str:
    """Return current time as a WIB ISO 8601 string (UTC+07:00)."""
    return datetime.now(_WIB).isoformat()


def iso_from_epoch(epoch: float) -> str:
    """Convert a Unix epoch (float seconds) to a WIB ISO 8601 string."""
    return datetime.fromtimestamp(epoch, tz=_WIB).isoformat()


def parse_iso(iso_str: str) -> datetime:
    """Parse an ISO 8601 string and return a timezone-aware datetime."""
    return datetime.fromisoformat(iso_str)


# ---------------------------------------------------------------------------
# WIB-specific helpers
# ---------------------------------------------------------------------------

def wib_now_iso() -> str:
    """Return current WIB time as an ISO 8601 string with +07:00 offset."""
    return datetime.now(_WIB).isoformat()


def wib_now_hms() -> str:
    """Return current WIB time as 'HH:MM:SS'."""
    return datetime.now(_WIB).strftime("%H:%M:%S")
