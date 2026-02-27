from __future__ import annotations

from collections import deque
from typing import Deque, Dict, List, Optional


_DEFAULT_MAXLEN = 600


class TimelineBuffer:
    """
    Fixed-size ring buffer of TimelinePoint-compatible dicts.

    Oldest entries are automatically discarded once the buffer reaches
    *maxlen* (default 600 — 20 minutes at 2 s / tick).
    """

    def __init__(self, maxlen: int = _DEFAULT_MAXLEN) -> None:
        self._buf: Deque[Dict] = deque(maxlen=maxlen)
        self._maxlen = maxlen

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def append(
        self,
        timestamp: str,
        current_volume: int,
        congestion_threshold: float,
        congestion_detected: bool,
        predicted_volume: Optional[int] = None,
    ) -> None:
        """
        Append one data point to the ring buffer.

        Parameters
        ----------
        timestamp : str
            ISO 8601 timestamp string.
        current_volume : int
            Observed vehicle count for this tick.
        congestion_threshold : float
            Threshold value (e.g. 80 % of capacity) used by the UI chart line.
        congestion_detected : bool
            Whether congestion was detected at this tick.
        predicted_volume : int | None
            Model-predicted volume for this tick (None for historical points
            that pre-date the first prediction).
        """
        self._buf.append(
            {
                "timestamp": timestamp,
                "currentVolume": current_volume,
                "predictedVolume": predicted_volume,
                "congestionThreshold": congestion_threshold,
                "congestionDetected": congestion_detected,
            }
        )

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def last(self, n: int) -> List[Dict]:
        """
        Return the *n* most recent points as a list of dicts (oldest first).

        If the buffer holds fewer than *n* points all available points are
        returned.
        """
        points = list(self._buf)
        return points[-n:] if n < len(points) else points

    def all(self) -> List[Dict]:
        """Return all buffered points (oldest first)."""
        return list(self._buf)

    # ------------------------------------------------------------------
    # Convenience helpers
    # ------------------------------------------------------------------

    def __len__(self) -> int:
        return len(self._buf)

    @property
    def maxlen(self) -> int:
        return self._maxlen

    def latest_current_volume(self) -> Optional[int]:
        """Return the currentVolume of the most recent point, or None."""
        if not self._buf:
            return None
        return self._buf[-1]["currentVolume"]

    def latest_predicted_volume(self) -> Optional[int]:
        """Return the predictedVolume of the most recent point, or None."""
        if not self._buf:
            return None
        return self._buf[-1]["predictedVolume"]

    def congestion_detected(self) -> bool:
        """Return the congestionDetected flag of the most recent point."""
        if not self._buf:
            return False
        return self._buf[-1]["congestionDetected"]
