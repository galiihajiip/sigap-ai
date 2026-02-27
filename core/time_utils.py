from datetime import datetime, timezone


def now_iso() -> str:
    """Return current UTC time as an ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()


def iso_from_epoch(epoch: float) -> str:
    """Convert a Unix epoch (float seconds) to an ISO 8601 string."""
    return datetime.fromtimestamp(epoch, tz=timezone.utc).isoformat()


def parse_iso(iso_str: str) -> datetime:
    """Parse an ISO 8601 string and return a timezone-aware datetime."""
    return datetime.fromisoformat(iso_str)
