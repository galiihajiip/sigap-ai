from __future__ import annotations

import os
import threading
import time
from typing import Any, Dict, Optional

import pandas as pd

from app.failsafe import check_all_failsafes, record_sensor_tick
from app.state_store import store
from core.config import (
    CONGESTION_ALERT_CAPACITY_PERCENT,
    DEFAULT_GREEN_SECONDS,
    DEFAULT_SYSTEM_CONFIDENCE_PERCENT,
    SIM_MINUTES_PER_TICK,
    TICK_SECONDS,
)
from core.schemas import (
    CameraFeedCard,
    IntersectionSummary,
    LiveMetrics,
    Prediction15m,
    PredictionTimeline,
    SystemStatus,
    TimelinePoint,
)
from core.time_utils import wib_now_iso
from ml.baselines import persistence
from ml.lstm_infer import SigapLSTMInference
from weather.service import get_weather_now
from rec.recommender import generate_top_recommendations
from sim.intersection import IntersectionSim
from sim.metrics import compute_flow_label
from sim.timeline import TimelineBuffer

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Rolling training buffer: 7 days × 24 h × 60 min at 1 tick/min
_MAX_BUFFER_ROWS = 7 * 24 * 60

# Intersection definitions (could be loaded from config/DB in production)
_INTERSECTIONS = [
    {
        "intersectionId": "SUR-4092",
        "locationName": "Jl. Soedirman, Surabaya",
        "city": "Surabaya",
    },
]

# ---------------------------------------------------------------------------
# LSTM model file path
# ---------------------------------------------------------------------------
_LSTM_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "ml", "artifacts", "sigap_model.h5",
)


# ---------------------------------------------------------------------------
# Per-intersection runtime state
# ---------------------------------------------------------------------------

class _IntersectionRuntime:
    def __init__(self, meta: Dict) -> None:
        self.intersection_id: str = meta["intersectionId"]
        self.location_name: str = meta["locationName"]
        self.city: str = meta["city"]
        self.sim = IntersectionSim(intersection_id=self.intersection_id)
        self.timeline_buf = TimelineBuffer(maxlen=600)

        # (tick, volume) history for ML baselines
        self._history: list = []

        # LSTM inference engine (one per intersection)
        self.infer = SigapLSTMInference()
        self._model_file: str = (
            "sigap_model.h5"
            if os.path.exists(_LSTM_MODEL_PATH)
            else "sigap_model.h5 (missing, fallback)"
        )

        # Rolling pandas DataFrame for ML training
        self.df_buffer: pd.DataFrame = pd.DataFrame(
            columns=[
                "tick",
                "timestamp",
                "currentVolume",
                "densityPercent",
                "queueLengthVehicles",
                "avgSpeedKmh",
                "flowRateCarsPerMin",
                "waitTimeMinutes",
            ]
        )

    def append_row(self, tick: int, snapshot: Dict) -> None:
        new_row = {
            "tick": tick,
            "timestamp": snapshot["timestamp"],
            "currentVolume": snapshot["currentVolume"],
            "densityPercent": snapshot["densityPercent"],
            "queueLengthVehicles": snapshot["queueLengthVehicles"],
            "avgSpeedKmh": snapshot["avgSpeedKmh"],
            "flowRateCarsPerMin": snapshot["flowRateCarsPerMin"],
            "waitTimeMinutes": snapshot["waitTimeMinutes"],
        }
        self.df_buffer = pd.concat(
            [self.df_buffer, pd.DataFrame([new_row])], ignore_index=True
        )
        # Keep rolling window
        if len(self.df_buffer) > _MAX_BUFFER_ROWS:
            self.df_buffer = self.df_buffer.iloc[-_MAX_BUFFER_ROWS:].reset_index(drop=True)

        self._history.append((tick, snapshot["currentVolume"]))
        if len(self._history) > _MAX_BUFFER_ROWS:
            self._history = self._history[-_MAX_BUFFER_ROWS:]

    @property
    def history(self) -> list:
        return self._history


# ---------------------------------------------------------------------------
# Horizon helpers
# ---------------------------------------------------------------------------

# 15 min at 1 sim-min/tick
_HORIZON_15M_TICKS = 15

_XGB_HORIZONS = {
    "2h": 120,   # ticks
    "4h": 240,
}


def _build_lstm_feature_row(
    snapshot: Dict,
    weather_condition: str,
    weather_temp_c: float,
    accident_count: int = 0,
    roadwork_flag: int = 0,
    event_flag: int = 0,
) -> Dict:
    """Build the feature dict expected by SigapLSTMInference.update()."""
    return {
        "vehicle_count_1min":  snapshot.get("flowRateCarsPerMin", 0.0),
        "avg_speed_kmh":       snapshot.get("avgSpeedKmh", 50.0),
        "queue_length_veh":    snapshot.get("queueLengthVehicles", 0),
        "wait_time_min":       snapshot.get("waitTimeMinutes", 0.0),
        "green_seconds":       snapshot.get("greenSeconds", 30),
        "density_percent":     snapshot.get("densityPercent", 0.0),
        "weather_temp_c":      weather_temp_c,
        "weather_condition":   weather_condition,
        "accident_count":      accident_count,
        "roadwork_flag":       roadwork_flag,
        "event_flag":          event_flag,
        "timestamp_wib":       snapshot.get("timestamp", wib_now_iso()),
    }


def _predict_15m(rt: _IntersectionRuntime, tick: int, snapshot: Dict) -> Prediction15m:
    """Produce a 15-minute prediction using the LSTM inference engine."""
    current_volume: int = snapshot["currentVolume"]
    density_pct: float = float(snapshot.get("densityPercent", 0.0))

    preds = rt.infer.predict(density_percent=density_pct)

    predicted_volume = preds["predictedVolume15m"]
    confidence       = preds["systemConfidencePercent"]
    risk_label       = preds["riskLabel"]

    # Derive a numeric congestion risk from density
    from ml.lstm_infer import compute_congestion_risk_percent
    congestion_risk = compute_congestion_risk_percent(density_pct)

    delta = predicted_volume - current_volume

    return Prediction15m(
        modelName="LSTM Neural Network",
        modelFile=rt._model_file,
        currentVolume=current_volume,
        predictedVolume15m=predicted_volume,
        deltaVolume=delta,
        congestionRiskPercent=round(congestion_risk, 1),
        riskLabel=risk_label,
        peakForecastTime=_estimate_peak_time_label(tick, _HORIZON_15M_TICKS),
        systemConfidencePercent=confidence,
    )


def _estimate_peak_time_label(tick: int, horizon_ticks: int) -> str:
    """Return HH:MM representation of the forecast horizon tick."""
    total_minutes = (tick + horizon_ticks) * SIM_MINUTES_PER_TICK
    hours = (total_minutes // 60) % 24
    minutes = total_minutes % 60
    return f"{int(hours):02d}:{int(minutes):02d}"


def _predict_horizons(rt: _IntersectionRuntime, snapshot: Dict) -> Dict[str, list]:
    """Produce multi-horizon forecast points using LSTM 2h/4h outputs."""
    density_pct = float(snapshot.get("densityPercent", 0.0))
    current_volume = snapshot["currentVolume"]

    capacity_volume = (
        current_volume / max(0.01, density_pct / 100.0)
        if density_pct > 0 else current_volume * 2
    )
    congestion_threshold = capacity_volume * CONGESTION_ALERT_CAPACITY_PERCENT / 100.0

    preds = rt.infer.predict(density_percent=density_pct)
    horizon_map = {
        "2h": preds["predictedVolume2h"],
        "4h": preds["predictedVolume4h"],
    }

    results: Dict[str, list] = {}
    for label, predicted in horizon_map.items():
        results[label] = [
            {
                "timestamp": wib_now_iso(),
                "currentVolume": current_volume,
                "predictedVolume": predicted,
                "congestionThreshold": round(congestion_threshold, 1),
                "congestionDetected": predicted >= congestion_threshold,
            }
        ]
    return results


# ---------------------------------------------------------------------------
# Tick loop core
# ---------------------------------------------------------------------------

def _build_timeline(rt: _IntersectionRuntime, pred: Prediction15m, snapshot: Dict) -> PredictionTimeline:
    """Append current point to the timeline buffer and return a PredictionTimeline."""
    capacity_volume = (
        snapshot["currentVolume"] / max(0.01, snapshot["densityPercent"] / 100.0)
        if snapshot["densityPercent"] > 0
        else snapshot["currentVolume"] * 2
    )
    threshold = capacity_volume * CONGESTION_ALERT_CAPACITY_PERCENT / 100.0
    congestion_detected = snapshot["currentVolume"] >= threshold

    rt.timeline_buf.append(
        timestamp=snapshot["timestamp"],
        current_volume=snapshot["currentVolume"],
        congestion_threshold=round(threshold, 1),
        congestion_detected=congestion_detected,
        predicted_volume=pred.predictedVolume15m,
    )

    points = [TimelinePoint(**p) for p in rt.timeline_buf.last(120)]
    return PredictionTimeline(
        points=points,
        pointsCount=len(points),
        latestCurrentVolume=rt.timeline_buf.latest_current_volume() or 0,
        latestPredictedVolume=rt.timeline_buf.latest_predicted_volume(),
        congestionDetected=rt.timeline_buf.congestion_detected(),
    )


def _build_intersection_summary(rt: _IntersectionRuntime) -> IntersectionSummary:
    plan = rt.sim.controller.get_plan()
    # Use S approach plan as the representative single-approach signal plan for UI
    s_plan = plan.get("S", {"greenSeconds": 45, "yellowSeconds": 5, "redSeconds": 40})
    return IntersectionSummary(
        intersectionId=rt.intersection_id,
        locationName=rt.location_name,
        city=rt.city,
        isActive=True,
        currentSignalPlan={
            "greenSeconds": s_plan["greenSeconds"],
            "yellowSeconds": s_plan["yellowSeconds"],
            "redSeconds": s_plan["redSeconds"],
        },
        lastAdjustedAt=wib_now_iso(),
    )


def _build_cameras(rt: _IntersectionRuntime, snapshot: Dict) -> list:
    """Generate synthetic CameraFeedCard entries from live metrics."""
    base_speed = snapshot["avgSpeedKmh"]
    cam_speeds = [base_speed, max(5.0, base_speed - 4.0), base_speed + 2.0, max(5.0, base_speed - 7.0)]
    cam_labels = [
        f"Cam 1 - {rt.location_name} North",
        f"Cam 2 - {rt.location_name} East",
        f"Cam 3 - {rt.location_name} South",
        f"Cam 4 - {rt.location_name} West",
    ]

    cams = []
    for idx, speed in enumerate(cam_speeds):
        cams.append(
            CameraFeedCard(
                cameraId=f"CAM-{rt.intersection_id}-{idx + 1}",
                label=cam_labels[idx],
                status="LIVE",
                flowLabel=compute_flow_label(speed),
                avgSpeedKmh=round(speed, 1),
                lastFrameTime=wib_now_iso(),
            )
        )
    return cams


# ---------------------------------------------------------------------------
# Runtimes (one per intersection)
# ---------------------------------------------------------------------------

_runtimes: Dict[str, _IntersectionRuntime] = {
    meta["intersectionId"]: _IntersectionRuntime(meta) for meta in _INTERSECTIONS
}


def _tick(tick: int) -> None:
    all_cameras = []

    for rt in _runtimes.values():
        # 1. Weather (cached 10 min by weather.service)
        weather = get_weather_now(
            location_key=rt.intersection_id,
            adm4=None,
        )
        rt.sim.set_weather(weather.tempC, weather.condition)

        # 2. Simulation step
        snapshot = rt.sim.step(tick)

        # 3. Append to rolling dataframe
        rt.append_row(tick, snapshot)

        # 4. Build typed LiveMetrics
        live = LiveMetrics(**snapshot)

        # 5. Feed LSTM inference buffer
        feature_row = _build_lstm_feature_row(
            snapshot=snapshot,
            weather_condition=weather.condition,
            weather_temp_c=weather.tempC,
        )
        rt.infer.update(feature_row)

        # 6. 15m prediction
        pred_15m = _predict_15m(rt, tick, snapshot)

        # 7. Multi-horizon forecast
        horizons = _predict_horizons(rt, snapshot)

        # 8. Timeline
        timeline = _build_timeline(rt, pred_15m, snapshot)

        # 9. Intersection summary
        intersection_summary = _build_intersection_summary(rt)

        # 10. Cameras
        cameras = _build_cameras(rt, snapshot)
        all_cameras.extend(cameras)

        # 11. Record sensor tick for failsafe tracker
        record_sensor_tick(rt.intersection_id)

        # 12. Write to state store
        store.update_live(rt.intersection_id, live)
        store.update_prediction15m(rt.intersection_id, pred_15m)
        store.update_timeline(rt.intersection_id, timeline)
        store.upsert_intersection(intersection_summary)
        for label, points in horizons.items():
            store.update_forecast(rt.intersection_id, label, points)

    # Cameras (all intersections)
    store.update_cameras(all_cameras)

    # Failsafe check (reverts stale intersections to baseline)
    check_all_failsafes({rt.intersection_id: rt.sim.controller for rt in _runtimes.values()})

    # 10. Recommendations (cross-intersection)
    recs = generate_top_recommendations(store)
    store.update_recommendations(recs)

    # 11. System status heartbeat
    store.update_system_status(
        systemOperational=True,
        live=True,
        message=(
            f"Tick {tick} — simulation running. "
            "Weather source: BMKG (cached 10 min). "
            "Timezone: WIB (Asia/Jakarta)."
        ),
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

_tick_counter = 0
_stop_event = threading.Event()


def _loop() -> None:
    global _tick_counter
    while not _stop_event.is_set():
        start = time.monotonic()
        try:
            _tick(_tick_counter)
            _tick_counter += 1
        except Exception as exc:  # noqa: BLE001
            store.update_system_status(
                systemOperational=False,
                mode="LOCAL_FALLBACK",
                message=f"Tick error: {exc}",
            )
        elapsed = time.monotonic() - start
        sleep_for = max(0.0, TICK_SECONDS - elapsed)
        _stop_event.wait(sleep_for)


def start_tick_loop() -> threading.Thread:
    """
    Start the background tick loop in a daemon thread.

    Call this once from the FastAPI lifespan or startup event.
    Returns the thread for reference (typically not needed).
    """
    _stop_event.clear()
    t = threading.Thread(target=_loop, name="sigap-tick-loop", daemon=True)
    t.start()
    return t


def stop_tick_loop() -> None:
    """Signal the tick loop to stop (used in tests / graceful shutdown)."""
    _stop_event.set()


def get_controller(intersection_id: str):
    """
    Return the SignalController for *intersection_id*, or None if not found.
    Used by route handlers that need to apply/revert the signal plan.
    """
    rt = _runtimes.get(intersection_id)
    return rt.sim.controller if rt is not None else None
