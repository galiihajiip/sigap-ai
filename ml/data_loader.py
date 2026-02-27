"""
ml/data_loader.py
-----------------
Loads the synthetic dummy traffic CSV and builds training-ready DataFrames
for tabular ML models (XGBoost, LightGBM, etc.).

Public API
----------
load_csv(path)                           -> pd.DataFrame (correct dtypes)
create_aggregated_view(df)               -> dict with keys "approach" and "total"
build_training_frames(df, level)         -> pd.DataFrame ready for model training
"""

from __future__ import annotations

import os
from typing import Literal

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Column dtype map
# ---------------------------------------------------------------------------
_INT_COLS: list[str] = [
    "tick",
    "vehicle_count_1min",
    "queue_length_veh",
    "green_seconds",
    "accident_count",
    "roadwork_flag",
    "event_flag",
]
_FLOAT_COLS: list[str] = [
    "volume_veh_per_hour",
    "avg_speed_kmh",
    "wait_time_min",
    "density_percent",
    "weather_temp_c",
    "target_volume_15m",
    "target_volume_2h",
    "target_volume_4h",
]
_STR_COLS: list[str] = ["intersectionId", "approach", "weather_condition"]
_TS_COL = "timestamp_wib"

# Target label columns
TARGET_COLS: list[str] = ["target_volume_15m", "target_volume_2h", "target_volume_4h"]

# Numeric feature columns present at approach level before engineering
_APPROACH_NUMERIC_FEATURES: list[str] = [
    "vehicle_count_1min",
    "volume_veh_per_hour",
    "avg_speed_kmh",
    "queue_length_veh",
    "wait_time_min",
    "green_seconds",
    "density_percent",
    "weather_temp_c",
    "accident_count",
    "roadwork_flag",
    "event_flag",
]

# Numeric feature columns present at total (intersection) level
_TOTAL_NUMERIC_FEATURES: list[str] = [
    "vehicle_count_1min_sum",
    "volume_veh_per_hour_sum",
    "avg_speed_kmh_mean",
    "queue_length_veh_sum",
    "wait_time_min_mean",
    "density_percent_mean",
    "weather_temp_c",
    "accident_count",
    "roadwork_flag",
    "event_flag",
]


# ---------------------------------------------------------------------------
# 1. load_csv
# ---------------------------------------------------------------------------

def load_csv(path: str | os.PathLike) -> pd.DataFrame:
    """
    Load a dummy traffic CSV produced by data/generate_dummy.py.

    Parameters
    ----------
    path : str or path-like
        Path to the CSV file (e.g. ``data/dummy_traffic_7d.csv``).

    Returns
    -------
    pd.DataFrame
        All columns have the correct dtypes; ``timestamp_wib`` is a
        timezone-aware datetime column (Asia/Jakarta / UTC+7).
    """
    df = pd.read_csv(path, low_memory=False)

    # Timestamp
    df[_TS_COL] = pd.to_datetime(df[_TS_COL], utc=True).dt.tz_convert("Asia/Jakarta")

    # Integer columns
    for col in _INT_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    # Float columns
    for col in _FLOAT_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype(float)

    # String / categorical columns
    for col in _STR_COLS:
        if col in df.columns:
            df[col] = df[col].astype("category")

    # Sort by intersection → approach → tick for chronological order
    df = df.sort_values(["intersectionId", "approach", "tick"]).reset_index(drop=True)

    return df


# ---------------------------------------------------------------------------
# 2. create_aggregated_view
# ---------------------------------------------------------------------------

def create_aggregated_view(df: pd.DataFrame) -> dict[str, pd.DataFrame]:
    """
    Produce two views of the dataset.

    Parameters
    ----------
    df : pd.DataFrame
        Raw approach-level DataFrame as returned by :func:`load_csv`.

    Returns
    -------
    dict with two keys:

    ``"approach"``
        The original approach-level data (sorted copy).

    ``"total"``
        Per-tick, per-intersection aggregated totals.  One row per
        (intersectionId, tick) with summed / mean statistics across all
        four approaches and the shared labels for target_volume_* columns.
    """
    approach_df = df.copy()

    # --- intersection-level aggregation ---
    agg_dict: dict[str, tuple | str] = {
        "timestamp_wib":        ("timestamp_wib", "first"),
        "vehicle_count_1min_sum": ("vehicle_count_1min", "sum"),
        "volume_veh_per_hour_sum": ("volume_veh_per_hour", "sum"),
        "avg_speed_kmh_mean":    ("avg_speed_kmh", "mean"),
        "queue_length_veh_sum":  ("queue_length_veh", "sum"),
        "wait_time_min_mean":    ("wait_time_min", "mean"),
        "density_percent_mean":  ("density_percent", "mean"),
        # shared columns (identical per tick) — take first row
        "weather_temp_c":        ("weather_temp_c", "first"),
        "weather_condition":     ("weather_condition", "first"),
        "accident_count":        ("accident_count", "first"),
        "roadwork_flag":         ("roadwork_flag", "first"),
        "event_flag":            ("event_flag", "first"),
        # targets — take the mean across approaches as an intersection-level label
        "target_volume_15m":     ("target_volume_15m", "mean"),
        "target_volume_2h":      ("target_volume_2h", "mean"),
        "target_volume_4h":      ("target_volume_4h", "mean"),
    }

    total_df = (
        df.groupby(["intersectionId", "tick"], observed=True)
        .agg(**{k: v for k, v in agg_dict.items()})
        .reset_index()
        .sort_values(["intersectionId", "tick"])
        .reset_index(drop=True)
    )

    # Round derived float columns
    for col in ("avg_speed_kmh_mean", "wait_time_min_mean", "density_percent_mean",
                "target_volume_15m", "target_volume_2h", "target_volume_4h"):
        if col in total_df.columns:
            total_df[col] = total_df[col].round(3)

    return {"approach": approach_df, "total": total_df}


# ---------------------------------------------------------------------------
# Internal: time-feature engineering
# ---------------------------------------------------------------------------

def _add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add calendar and cyclic time features derived from ``timestamp_wib``."""
    ts = df["timestamp_wib"]
    df = df.copy()

    df["hour"]          = ts.dt.hour.astype(np.int8)
    df["minute"]        = ts.dt.minute.astype(np.int8)
    df["day_of_week"]   = ts.dt.dayofweek.astype(np.int8)   # 0=Mon … 6=Sun
    df["is_weekend"]    = (ts.dt.dayofweek >= 5).astype(np.int8)

    # Continuous minute-of-day (0–1439) — useful for tree models
    df["minute_of_day"] = (ts.dt.hour * 60 + ts.dt.minute).astype(np.int16)

    # Cyclic encoding of hour (sin/cos) for models that benefit from it
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24).round(6)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24).round(6)

    # Binary peak flags
    df["is_morning_peak"] = (
        ((ts.dt.hour >= 6) & (ts.dt.hour < 9))
    ).astype(np.int8)
    df["is_evening_peak"] = (
        ((ts.dt.hour >= 16) & (ts.dt.hour < 19))
    ).astype(np.int8)

    return df


def _encode_weather(df: pd.DataFrame) -> pd.DataFrame:
    """One-hot encode weather_condition (drop Rain as reference category)."""
    dummies = pd.get_dummies(
        df["weather_condition"].astype(str),
        prefix="wcon",       # 'wcon' avoids collision with 'weather_temp_c'
        drop_first=False,   # keep all; caller can drop one if needed
        dtype=np.int8,
    )
    return pd.concat([df.drop(columns=["weather_condition"]), dummies], axis=1)


def _encode_approach(df: pd.DataFrame) -> pd.DataFrame:
    """One-hot encode approach (drop W as reference category)."""
    dummies = pd.get_dummies(
        df["approach"].astype(str),
        prefix="ap",
        drop_first=False,
        dtype=np.int8,
    )
    return pd.concat([df.drop(columns=["approach"]), dummies], axis=1)


# ---------------------------------------------------------------------------
# 3. build_training_frames
# ---------------------------------------------------------------------------

def build_training_frames(
    df: pd.DataFrame,
    level: Literal["total", "approach"] = "approach",
) -> pd.DataFrame:
    """
    Transform raw (or aggregated) data into a feature-rich DataFrame
    ready for tabular ML training.

    Steps applied:
    1. Select the correct level view (``"approach"`` or ``"total"``).
    2. Add calendar + cyclic time features from ``timestamp_wib``.
    3. One-hot encode ``weather_condition``.
    4. One-hot encode ``approach`` (approach level only).
    5. Drop non-feature columns (raw timestamp, string IDs).
    6. Preserve all three ``target_*`` columns at the end.
    7. Drop rows where ALL target columns are NaN (tail end of time-series).

    Parameters
    ----------
    df : pd.DataFrame
        Approach-level DataFrame as returned by :func:`load_csv` **or**
        the ``"total"`` DataFrame from :func:`create_aggregated_view`.
        The function auto-detects which it is by checking for the
        ``"approach"`` column.
    level : {"approach", "total"}
        If ``"approach"`` (default), the DataFrame must contain an
        ``"approach"`` column.  If ``"total"``, it uses intersection-level
        aggregated columns (``*_sum``, ``*_mean``).

    Returns
    -------
    pd.DataFrame
        Feature-only DataFrame.  Column order:

        * time features
        * numeric features
        * one-hot encoded categoricals
        * ``target_volume_15m``, ``target_volume_2h``, ``target_volume_4h``

        The index is reset and monotonic.

    Examples
    --------
    >>> from ml.data_loader import load_csv, build_training_frames
    >>> df = load_csv("data/dummy_traffic_7d.csv")
    >>> train = build_training_frames(df, level="approach")
    >>> X = train.drop(columns=["target_volume_15m",
    ...                          "target_volume_2h",
    ...                          "target_volume_4h"])
    >>> y = train["target_volume_15m"]
    """
    # ------------------------------------------------------------------
    # Determine granularity and select numeric features
    # ------------------------------------------------------------------
    is_approach_level = "approach" in df.columns and level == "approach"

    if is_approach_level:
        numeric_feats = _APPROACH_NUMERIC_FEATURES
    else:
        numeric_feats = _TOTAL_NUMERIC_FEATURES

    # Columns to keep before feature engineering
    keep_cols = (
        [_TS_COL]
        + (["approach"] if is_approach_level else [])
        + ["weather_condition"]
        + numeric_feats
        + TARGET_COLS
    )
    # Only keep columns that exist (robustness for both raw / aggregated dfs)
    keep_cols = [c for c in keep_cols if c in df.columns]

    out = df[keep_cols].copy()

    # ------------------------------------------------------------------
    # Feature engineering
    # ------------------------------------------------------------------
    out = _add_time_features(out)
    out = _encode_weather(out)
    if is_approach_level:
        out = _encode_approach(out)

    # Drop raw non-feature columns
    out = out.drop(columns=[_TS_COL], errors="ignore")

    # ------------------------------------------------------------------
    # Reorder: time features → numeric → encoded → targets
    # ------------------------------------------------------------------
    time_feats = [
        "hour", "minute", "day_of_week", "is_weekend",
        "minute_of_day", "hour_sin", "hour_cos",
        "is_morning_peak", "is_evening_peak",
    ]
    weather_feats = [c for c in out.columns if c.startswith("wcon_")]
    ap_feats      = [c for c in out.columns if c.startswith("ap_")]
    other_numeric = [
        c for c in numeric_feats if c in out.columns
    ]
    non_target_order = (
        time_feats
        + other_numeric
        + weather_feats
        + ap_feats
    )
    existing_non_target = [c for c in non_target_order if c in out.columns]
    out = out[existing_non_target + TARGET_COLS]

    # ------------------------------------------------------------------
    # Drop rows where ALL targets are NaN (look-ahead overflow at tail)
    # ------------------------------------------------------------------
    out = out.dropna(subset=TARGET_COLS, how="all").reset_index(drop=True)

    return out


# ---------------------------------------------------------------------------
# Convenience: quick summary
# ---------------------------------------------------------------------------

def describe_frame(df: pd.DataFrame, name: str = "frame") -> None:
    """Print a brief summary of a DataFrame (shape, dtypes, NaN counts)."""
    print(f"\n--- {name} ---")
    print(f"  shape : {df.shape}")
    print(f"  dtypes:\n{df.dtypes.value_counts().to_string()}")
    nan_counts = df.isna().sum()
    nan_counts = nan_counts[nan_counts > 0]
    if nan_counts.empty:
        print("  nulls : none")
    else:
        print(f"  nulls :\n{nan_counts.to_string()}")


# ---------------------------------------------------------------------------
# Quick self-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import os, sys

    _ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    _CSV = os.path.join(_ROOT, "data", "dummy_traffic_1d.csv")

    print(f"Loading {_CSV} …")
    raw = load_csv(_CSV)
    describe_frame(raw, "raw (approach level)")

    views = create_aggregated_view(raw)
    describe_frame(views["approach"], "aggregated → approach")
    describe_frame(views["total"],    "aggregated → total")

    train_ap = build_training_frames(views["approach"], level="approach")
    describe_frame(train_ap, "training frame (approach)")

    train_tot = build_training_frames(views["total"], level="total")
    describe_frame(train_tot, "training frame (total)")

    print("\nSample columns (approach):")
    print(train_ap.columns.tolist())
    print("\nFirst row:")
    print(train_ap.iloc[0].to_dict())
