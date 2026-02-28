"""
ml/lstm_infer.py
----------------
Real-time LSTM inference for the Sigap AI tick loop.

Usage example (called from app/tick_loop.py)
--------------------------------------------
    from ml.lstm_infer import SigapLSTMInference

    infer = SigapLSTMInference()          # loads artifacts once at startup

    # Every 2-second tick:
    infer.update(feature_row)             # feature_row is a plain dict
    result = infer.predict()              # returns prediction dict

    # result keys:
    #   predictedVolume15m   (int)
    #   predictedVolume2h    (int)
    #   predictedVolume4h    (int)
    #   band15mLow           (int)
    #   band15mHigh          (int)
    #   systemConfidencePercent (int, 50-99)
    #   riskLabel            (str)
"""

from __future__ import annotations

import collections
import json
import math
import os
import sys
from datetime import datetime
from typing import Any

import numpy as np

# ---------------------------------------------------------------------------
# Path setup — allow running as script from any cwd
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import joblib
from sklearn.preprocessing import StandardScaler

from ml.lstm_dataset import SEQ_LEN, CYCLE_SECONDS, WEATHER_CATEGORIES

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_DEFAULT_ARTIFACTS = os.path.join(_HERE, "artifacts")

# Confidence calibration: MAE reference value at which confidence = 75 %
_MAE_MID_CONF = 50.0          # veh/hr MAE where conf → 75 %
_CONF_MIN = 50
_CONF_MAX = 99

# Empirical residual band half-width multiplier (±k × MAE)
_BAND_K = 1.5

# Risk label thresholds (density_percent → label)
_RISK_THRESHOLDS = [
    (80.0, "Critical"),
    (60.0, "High"),
    (40.0, "Moderate"),
    (0.0,  "Smooth"),
]

# Rolling window for live residual tracking (ticks)
_RESIDUAL_WINDOW = 120

# WIB timezone reference
try:
    from zoneinfo import ZoneInfo
    _WIB = ZoneInfo("Asia/Jakarta")
except ImportError:
    from datetime import timezone, timedelta
    _WIB = timezone(timedelta(hours=7))


# ---------------------------------------------------------------------------
# Public helper
# ---------------------------------------------------------------------------

def compute_congestion_risk_percent(density_percent: float) -> float:
    """
    Map ``density_percent`` (0–100) to a risk score (0–100).

    Uses a piece-wise linear curve capped at 100:
        0 %    → risk  0 %
        40 %   → risk 30 %
        60 %   → risk 55 %
        80 %   → risk 80 %
        100 %  → risk 100 %
    """
    d = max(0.0, min(100.0, density_percent))
    segments = [
        (0.0,  40.0,  0.0,  30.0),
        (40.0, 60.0, 30.0,  55.0),
        (60.0, 80.0, 55.0,  80.0),
        (80.0, 100.0, 80.0, 100.0),
    ]
    for d_lo, d_hi, r_lo, r_hi in segments:
        if d <= d_hi:
            t = (d - d_lo) / (d_hi - d_lo) if d_hi > d_lo else 1.0
            return round(r_lo + t * (r_hi - r_lo), 2)
    return 100.0


def _risk_label(density_percent: float) -> str:
    for threshold, label in _RISK_THRESHOLDS:
        if density_percent >= threshold:
            return label
    return "Smooth"


# ---------------------------------------------------------------------------
# Feature row builder
# ---------------------------------------------------------------------------

def _build_feature_vector(
    row: dict[str, Any],
    feature_columns: list[str],
    weather_categories: list[str],
) -> np.ndarray:
    """
    Convert a raw feature dict (as produced by the tick loop) into a
    1-D numpy array aligned with ``feature_columns``.

    Time features (hour, minute_of_day, …) are derived from the
    ``timestamp_wib`` key if present; otherwise they default to the
    current WIB wall clock.
    """
    # Determine timestamp
    ts_raw = row.get("timestamp_wib")
    if ts_raw is not None:
        if isinstance(ts_raw, str):
            ts = datetime.fromisoformat(ts_raw)
        else:
            ts = ts_raw
    else:
        ts = datetime.now(_WIB)

    hour           = float(ts.hour)
    minute_of_day  = float(ts.hour * 60 + ts.minute)
    day_of_week    = float(ts.weekday())
    is_weekend     = float(ts.weekday() >= 5)
    hour_sin       = math.sin(2 * math.pi * hour / 24)
    hour_cos       = math.cos(2 * math.pi * hour / 24)
    is_morning     = float(6 <= ts.hour < 9)
    is_evening     = float(16 <= ts.hour < 19)

    # Volume proxy from queue
    queue = float(row.get("queue_length_veh", 0.0))
    volume_proxy = queue * (3600.0 / CYCLE_SECONDS)

    # Weather one-hot
    wcon = str(row.get("weather_condition", "Clear"))
    wcon_vals = {f"wcon_{c}": float(wcon == c) for c in weather_categories}

    full: dict[str, float] = {
        "vehicle_count_1min": float(row.get("vehicle_count_1min", 0.0)),
        "avg_speed_kmh":      float(row.get("avg_speed_kmh", 50.0)),
        "queue_length_veh":   queue,
        "wait_time_min":      float(row.get("wait_time_min", 0.0)),
        "green_seconds":      float(row.get("green_seconds", 30.0)),
        "density_percent":    float(row.get("density_percent", 0.0)),
        "weather_temp_c":     float(row.get("weather_temp_c", 30.0)),
        "accident_count":     float(row.get("accident_count", 0.0)),
        "roadwork_flag":      float(row.get("roadwork_flag", 0.0)),
        "event_flag":         float(row.get("event_flag", 0.0)),
        "volume_proxy":       volume_proxy,
        "hour":               hour,
        "minute_of_day":      minute_of_day,
        "day_of_week":        day_of_week,
        "is_weekend":         is_weekend,
        "hour_sin":           hour_sin,
        "hour_cos":           hour_cos,
        "is_morning_peak":    is_morning,
        "is_evening_peak":    is_evening,
        **wcon_vals,
    }

    return np.array([full.get(c, 0.0) for c in feature_columns], dtype=np.float32)


# ---------------------------------------------------------------------------
# Main inference class
# ---------------------------------------------------------------------------

class SigapLSTMInference:
    """
    Stateful LSTM inference engine for the Sigap AI tick loop.

    Parameters
    ----------
    artifacts_dir : str
        Path to the directory containing ``sigap_model.h5``,
        ``scaler.joblib``, ``feature_columns.json``,
        ``weather_encoder.json``, and ``lstm_metrics.json``.
    """

    def __init__(self, artifacts_dir: str = _DEFAULT_ARTIFACTS) -> None:
        self._artifacts_dir = artifacts_dir
        self._model = None
        self._scaler: StandardScaler | None = None
        self._feature_columns: list[str] = []
        self._idx_vehicle_count: int | None = None
        self._idx_volume_proxy: int | None = None
        self._weather_categories: list[str] = WEATHER_CATEGORIES
        self._mae_15m: float = _MAE_MID_CONF
        self._rmse_15m: float = _MAE_MID_CONF

        # Rolling buffer: deque of raw (unscaled) feature vectors
        self._buffer: collections.deque[np.ndarray] = collections.deque(
            maxlen=SEQ_LEN
        )

        # Rolling residuals for live confidence tracking
        self._residuals: collections.deque[float] = collections.deque(
            maxlen=_RESIDUAL_WINDOW
        )
        self._last_pred_15m: float | None = None

        # Last known volume_proxy for persistence fallback
        self._last_volume_proxy: float = 0.0

        self._loaded = False
        self._load_artifacts()

    # ------------------------------------------------------------------
    # Artifact loading
    # ------------------------------------------------------------------

    def _load_artifacts(self) -> None:
        adir = self._artifacts_dir

        # Feature columns
        fc_path = os.path.join(adir, "feature_columns.json")
        if os.path.exists(fc_path):
            with open(fc_path) as f:
                data = json.load(f)
            self._feature_columns = data["feature_columns"]
            if "vehicle_count_1min" in self._feature_columns:
                self._idx_vehicle_count = self._feature_columns.index("vehicle_count_1min")
            if "volume_proxy" in self._feature_columns:
                self._idx_volume_proxy = self._feature_columns.index("volume_proxy")
        else:
            raise FileNotFoundError(f"feature_columns.json not found in {adir}")

        # Weather encoder
        we_path = os.path.join(adir, "weather_encoder.json")
        if os.path.exists(we_path):
            with open(we_path) as f:
                we = json.load(f)
            self._weather_categories = we.get("categories", WEATHER_CATEGORIES)

        # Scaler
        sc_path = os.path.join(adir, "scaler.joblib")
        if os.path.exists(sc_path):
            self._scaler = joblib.load(sc_path)

        # Validation metrics (for confidence calibration)
        metrics_path = os.path.join(adir, "lstm_metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                m = json.load(f)
            self._mae_15m  = float(m.get("mae_15m",  _MAE_MID_CONF))
            self._rmse_15m = float(m.get("rmse_15m", _MAE_MID_CONF))

        # Keras model (lazy — import TF only when model file exists)
        model_path = os.path.join(adir, "sigap_model.h5")
        if os.path.exists(model_path):
            import tensorflow as tf
            self._model = tf.keras.models.load_model(model_path)
            self._loaded = True
        else:
            # Model not yet trained — fall back to persistence on every predict()
            self._loaded = False

    # ------------------------------------------------------------------
    # Confidence calibration
    # ------------------------------------------------------------------

    def _confidence(self) -> int:
        """
        Map MAE → confidence in [_CONF_MIN, _CONF_MAX].

        Live residuals are used when enough history is available;
        otherwise falls back to validation MAE from lstm_metrics.json.
        """
        if len(self._residuals) >= 10:
            live_mae = float(np.mean([abs(r) for r in self._residuals]))
        else:
            live_mae = self._mae_15m

        # Sigmoid-like mapping: conf = 99 when mae→0, 50 when mae→∞
        # conf = CONF_MIN + (CONF_MAX - CONF_MIN) × exp(-mae / MAE_MID)
        spread = _CONF_MAX - _CONF_MIN
        raw = _CONF_MIN + spread * math.exp(-live_mae / _MAE_MID_CONF)
        return int(max(_CONF_MIN, min(_CONF_MAX, round(raw))))

    # ------------------------------------------------------------------
    # Band calculation
    # ------------------------------------------------------------------

    def _band(self, pred_15m: float) -> tuple[int, int]:
        """
        Empirical confidence band around pred_15m.

        Uses live rolling RMSE if available, else validation RMSE.
        Half-width = _BAND_K × rmse.
        """
        if len(self._residuals) >= 10:
            live_rmse = float(np.sqrt(np.mean([r ** 2 for r in self._residuals])))
        else:
            live_rmse = self._rmse_15m

        half = _BAND_K * live_rmse
        low  = max(0.0, pred_15m - half)
        high = pred_15m + half
        return int(round(low)), int(round(high))

    # ------------------------------------------------------------------
    # Public: update
    # ------------------------------------------------------------------

    def update(self, feature_row: dict[str, Any]) -> None:
        """
        Ingest one tick of data.

        Parameters
        ----------
        feature_row : dict
            Must contain the raw keys expected by :func:`_build_feature_vector`.
            Minimal required keys:
               ``queue_length_veh``, ``density_percent``, ``weather_condition``,
               ``timestamp_wib`` (ISO str or datetime).
        """
        vec = _build_feature_vector(
            feature_row,
            self._feature_columns,
            self._weather_categories,
        )

        # Use observed flow as primary fallback signal so prediction remains dynamic
        # even when queue stays near zero (volume_proxy ~= 0).
        observed = 0.0
        if self._idx_vehicle_count is not None:
            observed = float(vec[self._idx_vehicle_count])
        if observed <= 0.0 and self._idx_volume_proxy is not None:
            observed = float(vec[self._idx_volume_proxy])
        self._last_volume_proxy = observed

        self._buffer.append(vec)

        # Update rolling residuals if we had a prediction last tick
        if self._last_pred_15m is not None:
            residual = self._last_volume_proxy - self._last_pred_15m
            self._residuals.append(residual)
            self._last_pred_15m = None

    # ------------------------------------------------------------------
    # Public: predict
    # ------------------------------------------------------------------

    def predict(self, density_percent: float = 0.0) -> dict[str, Any]:
        """
        Return a prediction dict for the current tick.

        Parameters
        ----------
        density_percent : float
            Current intersection-wide density (0–100 %) used for risk label.

        Returns
        -------
        dict with keys:
            predictedVolume15m    int
            predictedVolume2h     int
            predictedVolume4h     int
            band15mLow            int
            band15mHigh           int
            systemConfidencePercent int  (50–99)
            riskLabel             str   (Smooth / Moderate / High / Critical)
        """
        risk = _risk_label(density_percent)
        curr_vol = int(round(self._last_volume_proxy))

        # ----------------------------------------------------------
        # Fallback: not enough history or model not loaded
        # ----------------------------------------------------------
        if len(self._buffer) < SEQ_LEN or not self._loaded:
            band_low  = max(0, curr_vol - int(round(_BAND_K * self._rmse_15m)))
            band_high = curr_vol + int(round(_BAND_K * self._rmse_15m))
            return {
                "predictedVolume15m":       curr_vol,
                "predictedVolume2h":        curr_vol,
                "predictedVolume4h":        curr_vol,
                "band15mLow":               band_low,
                "band15mHigh":              band_high,
                "systemConfidencePercent":  60,
                "riskLabel":               risk,
            }

        # ----------------------------------------------------------
        # LSTM inference
        # ----------------------------------------------------------
        raw_seq = np.stack(list(self._buffer), axis=0)   # [SEQ_LEN, F]

        if self._scaler is not None:
            scaled = self._scaler.transform(raw_seq).astype(np.float32)
        else:
            scaled = raw_seq.astype(np.float32)

        x = scaled[np.newaxis, ...]                        # [1, SEQ_LEN, F]
        preds = self._model.predict(x, verbose=0)[0]       # [3]

        # volume_proxy outputs are in veh/hr units (same as training labels)
        pred_15m = float(max(0.0, preds[0]))
        pred_2h  = float(max(0.0, preds[1]))
        pred_4h  = float(max(0.0, preds[2]))

        # Guardrail: prevent unrealistically collapsed predictions when the
        # loaded model output drifts out-of-scale versus current live volume.
        floor_15m = max(1.0, curr_vol * 0.60)
        floor_2h = max(1.0, curr_vol * 0.70)
        floor_4h = max(1.0, curr_vol * 0.75)
        pred_15m = max(pred_15m, floor_15m)
        pred_2h = max(pred_2h, floor_2h)
        pred_4h = max(pred_4h, floor_4h)

        # Store for next-tick residual tracking
        self._last_pred_15m = pred_15m

        band_low, band_high = self._band(pred_15m)
        confidence = self._confidence()

        return {
            "predictedVolume15m":       int(round(pred_15m)),
            "predictedVolume2h":        int(round(pred_2h)),
            "predictedVolume4h":        int(round(pred_4h)),
            "band15mLow":               band_low,
            "band15mHigh":              band_high,
            "systemConfidencePercent":  confidence,
            "riskLabel":               risk,
        }

    # ------------------------------------------------------------------
    # Convenience properties
    # ------------------------------------------------------------------

    @property
    def ready(self) -> bool:
        """True when the buffer has enough history for a full LSTM pass."""
        return self._loaded and len(self._buffer) >= SEQ_LEN

    @property
    def buffer_fill(self) -> int:
        """Current number of ticks in the rolling buffer."""
        return len(self._buffer)


# ---------------------------------------------------------------------------
# Quick self-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import random
    from ml.data_loader import load_csv

    _CSV = os.path.join(_ROOT, "data", "dummy_traffic_1d.csv")
    print(f"Loading {_CSV} for replay …")
    df = load_csv(_CSV)

    infer = SigapLSTMInference()
    print(f"Artifacts loaded — model ready: {infer._loaded}")
    print(f"Feature columns: {infer._feature_columns}")

    rng = random.Random(42)
    tick_rows = (
        df.groupby("tick", observed=True)
        .agg({
            "vehicle_count_1min": "sum",
            "avg_speed_kmh":      "mean",
            "queue_length_veh":   "sum",
            "wait_time_min":      "mean",
            "green_seconds":      "mean",
            "density_percent":    "mean",
            "weather_temp_c":     "first",
            "weather_condition":  "first",
            "accident_count":     "first",
            "roadwork_flag":      "first",
            "event_flag":         "first",
            "timestamp_wib":      "first",
        })
        .reset_index()
    )

    print(f"\nReplaying {len(tick_rows)} ticks …")
    for idx, row in tick_rows.iterrows():
        feat = row.to_dict()
        feat["weather_condition"] = str(feat["weather_condition"])
        feat["timestamp_wib"] = str(feat["timestamp_wib"])
        infer.update(feat)

        if idx in (0, 30, 59, 60, 100, 200):
            result = infer.predict(density_percent=float(feat["density_percent"]))
            print(
                f"  tick={idx:>4}  buf={infer.buffer_fill:>3}  ready={infer.ready}"
                f"  15m={result['predictedVolume15m']:>5}"
                f"  band=[{result['band15mLow']},{result['band15mHigh']}]"
                f"  conf={result['systemConfidencePercent']}%"
                f"  risk={result['riskLabel']}"
            )

    print("\ncongestion_risk_percent tests:")
    for d in [0, 20, 40, 60, 80, 100]:
        print(f"  density={d:>3}% → risk={compute_congestion_risk_percent(d):.1f}%")

    print("\nDone.")
