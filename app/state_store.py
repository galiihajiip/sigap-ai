from __future__ import annotations

import threading
from copy import deepcopy
from typing import Any, Dict, List, Optional

from core.config import (
    DEFAULT_GREEN_SECONDS,
    DEFAULT_SYSTEM_CONFIDENCE_PERCENT,
    CONGESTION_ALERT_CAPACITY_PERCENT,
)
from core.schemas import (
    CameraFeedCard,
    DecisionLogRow,
    IntersectionSummary,
    LiveMetrics,
    NotificationItem,
    Prediction15m,
    PredictionTimeline,
    Recommendation,
    SettingsPayload,
    SystemStatus,
    NotificationChannels,
    IntersectionOverdrive,
)
from core.time_utils import now_iso


# ---------------------------------------------------------------------------
# Placeholder / default initial state
# ---------------------------------------------------------------------------

def _default_system_status() -> SystemStatus:
    return SystemStatus(
        systemOperational=True,
        mode="AI_ACTIVE",
        lastUpdate=now_iso(),
        live=True,
        message="System initialising.",
    )


def _default_settings() -> SettingsPayload:
    return SettingsPayload(
        congestionAlertCapacityPercent=CONGESTION_ALERT_CAPACITY_PERCENT,
        incidentDetectionSensitivity="MEDIUM",
        notificationChannels=NotificationChannels(
            email=True,
            sms=False,
            desktopPush=True,
        ),
        intersectionOverdrives=[],
    )


# ---------------------------------------------------------------------------
# State store
# ---------------------------------------------------------------------------

class StateStore:
    """Thread-safe in-memory state store for the Sigap AI backend."""

    def __init__(self) -> None:
        self._lock = threading.RLock()

        # --- top-level state ---
        self._system_status: SystemStatus = _default_system_status()
        self._cameras: List[CameraFeedCard] = []
        self._intersections: Dict[str, IntersectionSummary] = {}
        self._live_metrics: Dict[str, LiveMetrics] = {}
        self._prediction_15m: Dict[str, Prediction15m] = {}
        self._timeline: Dict[str, PredictionTimeline] = {}

        # forecast[intersectionId][horizon] -> list[dict]  (placeholder, raw dicts)
        self._forecast: Dict[str, Dict[str, List[Any]]] = {}

        self._recommendations_top: List[Recommendation] = []
        self._notifications: List[NotificationItem] = []
        self._decision_log: List[DecisionLogRow] = []
        self._settings: SettingsPayload = _default_settings()

    # -----------------------------------------------------------------------
    # Snapshot
    # -----------------------------------------------------------------------

    def get_snapshot(self) -> Dict[str, Any]:
        """Return a deep-copy snapshot of the entire state (thread-safe)."""
        with self._lock:
            return deepcopy(
                {
                    "systemStatus": self._system_status,
                    "cameras": self._cameras,
                    "intersections": self._intersections,
                    "liveMetrics": self._live_metrics,
                    "prediction15m": self._prediction_15m,
                    "timeline": self._timeline,
                    "forecast": self._forecast,
                    "recommendationsTop": self._recommendations_top,
                    "notifications": self._notifications,
                    "decisionLog": self._decision_log,
                    "settings": self._settings,
                }
            )

    # -----------------------------------------------------------------------
    # System status
    # -----------------------------------------------------------------------

    def update_system_status(
        self,
        *,
        systemOperational: Optional[bool] = None,
        mode: Optional[str] = None,
        live: Optional[bool] = None,
        message: Optional[str] = None,
    ) -> None:
        with self._lock:
            current = self._system_status.model_dump()
            if systemOperational is not None:
                current["systemOperational"] = systemOperational
            if mode is not None:
                current["mode"] = mode
            if live is not None:
                current["live"] = live
            if message is not None:
                current["message"] = message
            current["lastUpdate"] = now_iso()
            self._system_status = SystemStatus(**current)

    def get_system_status(self) -> SystemStatus:
        with self._lock:
            return deepcopy(self._system_status)

    # -----------------------------------------------------------------------
    # Cameras
    # -----------------------------------------------------------------------

    def update_cameras(self, cameras: List[CameraFeedCard]) -> None:
        with self._lock:
            self._cameras = list(cameras)

    def get_cameras(self) -> List[CameraFeedCard]:
        with self._lock:
            return deepcopy(self._cameras)

    # -----------------------------------------------------------------------
    # Intersections
    # -----------------------------------------------------------------------

    def upsert_intersection(self, summary: IntersectionSummary) -> None:
        with self._lock:
            self._intersections[summary.intersectionId] = summary

    def get_intersections(self) -> List[IntersectionSummary]:
        with self._lock:
            return deepcopy(list(self._intersections.values()))

    def get_intersection(self, intersection_id: str) -> Optional[IntersectionSummary]:
        with self._lock:
            return deepcopy(self._intersections.get(intersection_id))

    # -----------------------------------------------------------------------
    # Live metrics
    # -----------------------------------------------------------------------

    def update_live(self, intersection_id: str, metrics: LiveMetrics) -> None:
        with self._lock:
            self._live_metrics[intersection_id] = metrics

    def get_live(self, intersection_id: str) -> Optional[LiveMetrics]:
        with self._lock:
            return deepcopy(self._live_metrics.get(intersection_id))

    # -----------------------------------------------------------------------
    # 15-minute prediction
    # -----------------------------------------------------------------------

    def update_prediction15m(self, intersection_id: str, pred: Prediction15m) -> None:
        with self._lock:
            self._prediction_15m[intersection_id] = pred

    def get_prediction15m(self, intersection_id: str) -> Optional[Prediction15m]:
        with self._lock:
            return deepcopy(self._prediction_15m.get(intersection_id))

    # -----------------------------------------------------------------------
    # Prediction timeline
    # -----------------------------------------------------------------------

    def update_timeline(self, intersection_id: str, timeline: PredictionTimeline) -> None:
        with self._lock:
            self._timeline[intersection_id] = timeline

    def get_timeline(self, intersection_id: str) -> Optional[PredictionTimeline]:
        with self._lock:
            return deepcopy(self._timeline.get(intersection_id))

    # -----------------------------------------------------------------------
    # Forecast (multi-horizon, placeholder raw dicts)
    # -----------------------------------------------------------------------

    def update_forecast(
        self, intersection_id: str, horizon: str, points: List[Any]
    ) -> None:
        with self._lock:
            if intersection_id not in self._forecast:
                self._forecast[intersection_id] = {}
            self._forecast[intersection_id][horizon] = points

    def get_forecast(
        self, intersection_id: str, horizon: Optional[str] = None
    ) -> Any:
        with self._lock:
            data = self._forecast.get(intersection_id, {})
            if horizon is not None:
                return deepcopy(data.get(horizon, []))
            return deepcopy(data)

    # -----------------------------------------------------------------------
    # Recommendations
    # -----------------------------------------------------------------------

    def update_recommendations(self, recommendations: List[Recommendation]) -> None:
        with self._lock:
            self._recommendations_top = list(recommendations)

    def get_recommendations(self) -> List[Recommendation]:
        with self._lock:
            return deepcopy(self._recommendations_top)

    def apply_recommendation(self, recommendation_id: str) -> Optional[Recommendation]:
        with self._lock:
            for i, rec in enumerate(self._recommendations_top):
                if rec.recommendationId == recommendation_id:
                    updated = rec.model_copy(update={"status": "APPLIED"})
                    self._recommendations_top[i] = updated
                    return deepcopy(updated)
            return None

    def reject_recommendation(self, recommendation_id: str) -> Optional[Recommendation]:
        with self._lock:
            for i, rec in enumerate(self._recommendations_top):
                if rec.recommendationId == recommendation_id:
                    updated = rec.model_copy(update={"status": "REJECTED"})
                    self._recommendations_top[i] = updated
                    return deepcopy(updated)
            return None

    # -----------------------------------------------------------------------
    # Decision log
    # -----------------------------------------------------------------------

    def append_decision_log(self, row: DecisionLogRow) -> None:
        with self._lock:
            self._decision_log.insert(0, row)  # newest first

    def get_decision_log(self, limit: int = 100) -> List[DecisionLogRow]:
        with self._lock:
            return deepcopy(self._decision_log[:limit])

    # -----------------------------------------------------------------------
    # Notifications
    # -----------------------------------------------------------------------

    def append_notification(self, item: NotificationItem) -> None:
        with self._lock:
            self._notifications.insert(0, item)  # newest first

    def get_notifications(self) -> List[NotificationItem]:
        with self._lock:
            return deepcopy(self._notifications)

    def mark_all_notifications_read(self) -> int:
        with self._lock:
            count = 0
            for i, n in enumerate(self._notifications):
                if not n.read:
                    self._notifications[i] = n.model_copy(update={"read": True})
                    count += 1
            return count

    # -----------------------------------------------------------------------
    # Settings
    # -----------------------------------------------------------------------

    def update_settings(self, payload: SettingsPayload) -> None:
        with self._lock:
            self._settings = payload

    def get_settings(self) -> SettingsPayload:
        with self._lock:
            return deepcopy(self._settings)


# ---------------------------------------------------------------------------
# Singleton instance
# ---------------------------------------------------------------------------

store = StateStore()
