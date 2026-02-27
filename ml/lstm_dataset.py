"""
ml/lstm_dataset.py
------------------
Builds sliding-window sequences from the synthetic traffic CSV for LSTM training.

Public API
----------
build_sequences(df, level, artifacts_dir)
    -> (X_train, y_train, X_val, y_val, X_test, y_test)

load_artifacts(artifacts_dir)
    -> dict with keys: scaler, feature_columns, weather_encoder

Split convention (time-based, 7-day dataset):
    train : ticks 0 … 6719   (days 0-4, 5 days)
    val   : ticks 6720 … 8159 (day 5, 1 day)
    test  : ticks 8160 … 9999+ (day 6, 1 day)

Sequence settings:
    SEQ_LEN = 60 ticks (60 simulated minutes of history)
    H15     = 15  ticks ahead
    H2H     = 120 ticks ahead
    H4H     = 240 ticks ahead

Artifacts saved to ml/artifacts/ (or custom dir):
    scaler.joblib          StandardScaler fitted on train split
    feature_columns.json   ordered list of input feature names
    weather_encoder.json   category → one-hot column mapping
"""

from __future__ import annotations

import json
import os
import sys
from typing import Literal

import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

# ---------------------------------------------------------------------------
# Allow running as a script from any cwd
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from ml.data_loader import load_csv

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SEQ_LEN = 60      # history window (ticks)
H15     = 15      # 15-minute horizon
H2H     = 120     # 2-hour horizon
H4H     = 240     # 4-hour horizon

HORIZONS = [H15, H2H, H4H]

# Signal cycle length (seconds) — used for volume_proxy scaling
CYCLE_SECONDS = 90

# Time-based split boundaries (tick index, 0-based)
TRAIN_END_TICK = 6719   # ticks 0..6719  = 5 days × 24 h × 60 min − 1
VAL_END_TICK   = 8159   # ticks 6720..8159 = 1 day

# Weather one-hot categories (fixed order for reproducibility)
WEATHER_CATEGORIES = ["Rain", "Cloudy", "Hot", "Clear"]

# Approach one-hot categories
APPROACH_CATEGORIES = ["N", "E", "S", "W"]

# Default artifacts directory
_DEFAULT_ARTIFACTS = os.path.join(_HERE, "artifacts")

# ---------------------------------------------------------------------------
# Volume proxy
# ---------------------------------------------------------------------------

def _compute_volume_proxy(df: pd.DataFrame) -> pd.Series:
    """
    volume_proxy = queue_length_veh × (3600 / CYCLE_SECONDS)

    Scales queue to a vehicles-per-hour equivalent so it is on the same
    order of magnitude as volume_veh_per_hour, making targets comparable
    across models.  See ml/VOLUME_DEFINITION.md.
    """
    return df["queue_length_veh"].astype(float) * (3600.0 / CYCLE_SECONDS)


# ---------------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------------

def _one_hot(series: pd.Series, categories: list[str], prefix: str) -> pd.DataFrame:
    """Return a one-hot DataFrame with fixed column order."""
    dummies: dict[str, list[int]] = {}
    for cat in categories:
        col = f"{prefix}_{cat}"
        dummies[col] = (series.astype(str) == cat).astype(np.int8).tolist()
    return pd.DataFrame(dummies, index=series.index)


def _add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    ts = df["timestamp_wib"]
    out = df.copy()
    out["hour"]          = ts.dt.hour.astype(np.float32)
    out["minute_of_day"] = (ts.dt.hour * 60 + ts.dt.minute).astype(np.float32)
    out["day_of_week"]   = ts.dt.dayofweek.astype(np.float32)
    out["is_weekend"]    = (ts.dt.dayofweek >= 5).astype(np.float32)
    out["hour_sin"]      = np.sin(2 * np.pi * out["hour"] / 24).astype(np.float32)
    out["hour_cos"]      = np.cos(2 * np.pi * out["hour"] / 24).astype(np.float32)
    out["is_morning_peak"] = ((ts.dt.hour >= 6) & (ts.dt.hour < 9)).astype(np.float32)
    out["is_evening_peak"] = ((ts.dt.hour >= 16) & (ts.dt.hour < 19)).astype(np.float32)
    return out


def _build_feature_df(
    df: pd.DataFrame,
    level: Literal["total", "approach"],
) -> tuple[pd.DataFrame, list[str]]:
    """
    Build a single time-indexed feature DataFrame (one row per tick).

    For level="approach":  returns 4× as many rows (N/E/S/W per tick), with
    approach one-hot columns appended.  The caller must slice by approach
    or use the approach-aware sequence builder.

    Returns
    -------
    feat_df : pd.DataFrame
        Rows sorted by tick (then approach for approach level).
        Index is reset.
    feature_cols : list[str]
        Ordered list of numeric feature column names (excludes targets).
    """
    df = df.copy()
    df["volume_proxy"] = _compute_volume_proxy(df)
    df = _add_time_features(df)

    # Weather one-hot
    wdummies = _one_hot(df["weather_condition"].astype(str), WEATHER_CATEGORIES, "wcon")
    df = pd.concat([df, wdummies], axis=1)

    # Base numeric features (shared across both levels)
    base_num = [
        "vehicle_count_1min",
        "avg_speed_kmh",
        "queue_length_veh",
        "wait_time_min",
        "green_seconds",
        "density_percent",
        "weather_temp_c",
        "accident_count",
        "roadwork_flag",
        "event_flag",
        "volume_proxy",
    ]
    time_feats = [
        "hour", "minute_of_day", "day_of_week", "is_weekend",
        "hour_sin", "hour_cos", "is_morning_peak", "is_evening_peak",
    ]
    weather_feats = [f"wcon_{c}" for c in WEATHER_CATEGORIES]
    feature_cols = base_num + time_feats + weather_feats

    if level == "approach":
        ap_dummies = _one_hot(df["approach"].astype(str), APPROACH_CATEGORIES, "ap")
        df = pd.concat([df, ap_dummies], axis=1)
        ap_feats = [f"ap_{a}" for a in APPROACH_CATEGORIES]
        feature_cols = feature_cols + ap_feats

    # Keep only needed columns + targets
    keep = ["timestamp_wib", "tick"] + feature_cols + ["volume_proxy"]
    if level == "approach":
        keep = ["approach"] + keep
    keep = [c for c in keep if c in df.columns]

    # Remove duplicate columns (volume_proxy appears in base_num and as derived col)
    seen: set[str] = set()
    keep_dedup = []
    for c in keep:
        if c not in seen:
            keep_dedup.append(c)
            seen.add(c)

    feat_df = df[keep_dedup].copy()

    # Ensure feature_cols are unique
    feature_cols = list(dict.fromkeys(feature_cols))

    return feat_df, feature_cols


# ---------------------------------------------------------------------------
# Aggregation to intersection-total level
# ---------------------------------------------------------------------------

def _aggregate_to_total(df: pd.DataFrame) -> pd.DataFrame:
    """
    Collapse the 4-approach rows per tick into one intersection-total row.

    Summable columns are summed; rate/ratio columns are averaged.
    volume_proxy is summed (total queue across all approaches).
    """
    sum_cols  = ["vehicle_count_1min", "queue_length_veh", "accident_count",
                 "roadwork_flag", "event_flag"]
    mean_cols = ["avg_speed_kmh", "wait_time_min", "green_seconds",
                 "density_percent", "weather_temp_c"]

    agg: dict[str, object] = {"timestamp_wib": ("timestamp_wib", "first")}
    for c in sum_cols:
        if c in df.columns:
            agg[c] = (c, "sum")
    for c in mean_cols:
        if c in df.columns:
            agg[c] = (c, "mean")

    # Weather shared per tick — take first
    if "weather_condition" in df.columns:
        agg["weather_condition"] = ("weather_condition", "first")

    total_df = (
        df.groupby(["intersectionId", "tick"], observed=True)
        .agg(**agg)
        .reset_index()
        .sort_values("tick")
        .reset_index(drop=True)
    )
    return total_df


# ---------------------------------------------------------------------------
# Sliding-window sequence builder
# ---------------------------------------------------------------------------

def _make_sequences(
    feat_df: pd.DataFrame,
    feature_cols: list[str],
    scaler: StandardScaler | None,
    fit_scaler: bool,
) -> tuple[np.ndarray, np.ndarray, StandardScaler]:
    """
    Build (X, y) sliding-window arrays from a single-series feature DataFrame.

    Parameters
    ----------
    feat_df : pd.DataFrame
        Sorted by tick; one row per tick.
    feature_cols : list[str]
        Names of input feature columns.
    scaler : StandardScaler or None
        If provided, used to transform (not fit).
    fit_scaler : bool
        If True, fit a new StandardScaler on this data and return it.

    Returns
    -------
    X : ndarray [N, SEQ_LEN, F]
    y : ndarray [N, 3]  (proxy volumes at H15, H2H, H4H)
    scaler : StandardScaler
    """
    values = feat_df[feature_cols].astype(np.float32).values  # [T, F]
    proxy  = feat_df["volume_proxy"].astype(np.float32).values  # [T]

    if fit_scaler:
        scaler = StandardScaler()
        values = scaler.fit_transform(values).astype(np.float32)
    elif scaler is not None:
        values = scaler.transform(values).astype(np.float32)

    T = len(values)
    max_horizon = max(HORIZONS)
    # Valid range: sequence ends at t, label at t+H;  need t >= SEQ_LEN-1 and t+H4H < T
    last_valid = T - max_horizon - 1

    X_list: list[np.ndarray] = []
    y_list: list[np.ndarray] = []

    for t in range(SEQ_LEN - 1, last_valid + 1):
        X_list.append(values[t - SEQ_LEN + 1 : t + 1])          # [SEQ_LEN, F]
        y_list.append([proxy[t + h] for h in HORIZONS])          # [3]

    if not X_list:
        return (
            np.empty((0, SEQ_LEN, len(feature_cols)), dtype=np.float32),
            np.empty((0, 3), dtype=np.float32),
            scaler or StandardScaler(),
        )

    X = np.stack(X_list, axis=0).astype(np.float32)
    y = np.array(y_list, dtype=np.float32)
    return X, y, scaler


# ---------------------------------------------------------------------------
# Split helper
# ---------------------------------------------------------------------------

def _tick_split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    train = df[df["tick"] <= TRAIN_END_TICK].reset_index(drop=True)
    val   = df[(df["tick"] > TRAIN_END_TICK) & (df["tick"] <= VAL_END_TICK)].reset_index(drop=True)
    test  = df[df["tick"] > VAL_END_TICK].reset_index(drop=True)
    return train, val, test


# ---------------------------------------------------------------------------
# Public: build_sequences
# ---------------------------------------------------------------------------

def build_sequences(
    df: pd.DataFrame,
    level: Literal["total", "approach"] = "total",
    artifacts_dir: str = _DEFAULT_ARTIFACTS,
) -> tuple[
    np.ndarray, np.ndarray,
    np.ndarray, np.ndarray,
    np.ndarray, np.ndarray,
]:
    """
    Build LSTM-ready sliding-window sequences from a raw traffic DataFrame.

    Parameters
    ----------
    df : pd.DataFrame
        As returned by ``ml.data_loader.load_csv``.
    level : {"total", "approach"}
        ``"total"``    — one time series per intersection (4 approaches summed).
        ``"approach"`` — four time series (one per approach) concatenated into
                         a single X/y split; approach identity encoded as OHE.
    artifacts_dir : str
        Directory where scaler.joblib, feature_columns.json, and
        weather_encoder.json are saved.

    Returns
    -------
    X_train, y_train, X_val, y_val, X_test, y_test
        X : float32 array [N, SEQ_LEN, num_features]
        y : float32 array [N, 3]  (volume_proxy at H15, H2H, H4H)
    """
    os.makedirs(artifacts_dir, exist_ok=True)

    if level == "total":
        total_raw = _aggregate_to_total(df)
        feat_df, feature_cols = _build_feature_df(total_raw, level="total")

        train_df, val_df, test_df = _tick_split(feat_df)

        X_tr, y_tr, scaler = _make_sequences(train_df, feature_cols, None, fit_scaler=True)
        X_va, y_va, _      = _make_sequences(val_df,   feature_cols, scaler, fit_scaler=False)
        X_te, y_te, _      = _make_sequences(test_df,  feature_cols, scaler, fit_scaler=False)

    else:  # approach level
        feat_df_all, feature_cols = _build_feature_df(df, level="approach")

        # Fit scaler using all train-split data across all approaches
        train_all = feat_df_all[feat_df_all["tick"] <= TRAIN_END_TICK]
        scaler = StandardScaler()
        scaler.fit(train_all[feature_cols].astype(np.float32).values)

        Xs_tr, ys_tr = [], []
        Xs_va, ys_va = [], []
        Xs_te, ys_te = [], []

        for ap in APPROACH_CATEGORIES:
            ap_df = feat_df_all[feat_df_all["approach"] == ap].reset_index(drop=True)
            tr_ap, va_ap, te_ap = _tick_split(ap_df)

            X, y, _ = _make_sequences(tr_ap, feature_cols, scaler, fit_scaler=False)
            Xs_tr.append(X); ys_tr.append(y)

            X, y, _ = _make_sequences(va_ap, feature_cols, scaler, fit_scaler=False)
            Xs_va.append(X); ys_va.append(y)

            X, y, _ = _make_sequences(te_ap, feature_cols, scaler, fit_scaler=False)
            Xs_te.append(X); ys_te.append(y)

        X_tr = np.concatenate(Xs_tr, axis=0)
        y_tr = np.concatenate(ys_tr, axis=0)
        X_va = np.concatenate(Xs_va, axis=0)
        y_va = np.concatenate(ys_va, axis=0)
        X_te = np.concatenate(Xs_te, axis=0)
        y_te = np.concatenate(ys_te, axis=0)

    # ------------------------------------------------------------------
    # Save artifacts
    # ------------------------------------------------------------------
    scaler_path = os.path.join(artifacts_dir, "scaler.joblib")
    joblib.dump(scaler, scaler_path)

    fc_path = os.path.join(artifacts_dir, "feature_columns.json")
    with open(fc_path, "w") as f:
        json.dump({"level": level, "feature_columns": feature_cols}, f, indent=2)

    we_path = os.path.join(artifacts_dir, "weather_encoder.json")
    weather_encoder = {
        "categories": WEATHER_CATEGORIES,
        "columns":    [f"wcon_{c}" for c in WEATHER_CATEGORIES],
    }
    with open(we_path, "w") as f:
        json.dump(weather_encoder, f, indent=2)

    print(
        f"[lstm_dataset] level={level!r}  "
        f"train={X_tr.shape}  val={X_va.shape}  test={X_te.shape}  "
        f"features={X_tr.shape[2] if X_tr.ndim == 3 else '?'}"
    )
    print(f"  Artifacts saved to: {artifacts_dir}")

    return X_tr, y_tr, X_va, y_va, X_te, y_te


# ---------------------------------------------------------------------------
# Public: load_artifacts
# ---------------------------------------------------------------------------

def load_artifacts(
    artifacts_dir: str = _DEFAULT_ARTIFACTS,
) -> dict:
    """
    Load previously saved scaler and encoder artifacts.

    Returns
    -------
    dict with keys:
        "scaler"          : fitted StandardScaler
        "feature_columns" : list[str]
        "weather_encoder" : dict (categories + columns)
    """
    scaler = joblib.load(os.path.join(artifacts_dir, "scaler.joblib"))

    with open(os.path.join(artifacts_dir, "feature_columns.json")) as f:
        fc_data = json.load(f)

    with open(os.path.join(artifacts_dir, "weather_encoder.json")) as f:
        we_data = json.load(f)

    return {
        "scaler":          scaler,
        "feature_columns": fc_data["feature_columns"],
        "weather_encoder": we_data,
    }


# ---------------------------------------------------------------------------
# Quick self-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    _CSV = os.path.join(_ROOT, "data", "dummy_traffic_7d.csv")
    print(f"Loading {_CSV} …")
    raw = load_csv(_CSV)

    print("\n=== level=total ===")
    Xtr, ytr, Xva, yva, Xte, yte = build_sequences(raw, level="total")
    print(f"  X_train : {Xtr.shape}  y_train : {ytr.shape}")
    print(f"  X_val   : {Xva.shape}  y_val   : {yva.shape}")
    print(f"  X_test  : {Xte.shape}  y_test  : {yte.shape}")
    print(f"  y sample (first row): {ytr[0]}")

    print("\n=== level=approach ===")
    Xtr2, ytr2, Xva2, yva2, Xte2, yte2 = build_sequences(raw, level="approach")
    print(f"  X_train : {Xtr2.shape}  y_train : {ytr2.shape}")
    print(f"  X_val   : {Xva2.shape}  y_val   : {yva2.shape}")
    print(f"  X_test  : {Xte2.shape}  y_test  : {yte2.shape}")

    arts = load_artifacts()
    print(f"\nArtifacts loaded OK — {len(arts['feature_columns'])} features")
    print("Feature columns:", arts["feature_columns"])
    print("Done.")
