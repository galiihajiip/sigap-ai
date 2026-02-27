"""
scripts/sanity_check_data.py
-----------------------------
Sanity-checks data/dummy_traffic_1d.csv for realism.

Run from the project root:
    python scripts/sanity_check_data.py
"""

from __future__ import annotations

import os
import sys

# Make sure project root is on the path
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from ml.data_loader import load_csv

CSV_PATH = os.path.join(_ROOT, "data", "dummy_traffic_1d.csv")

SEP = "-" * 60


def _fmt(val: float, decimals: int = 2) -> str:
    return f"{val:.{decimals}f}"


def main() -> None:
    print(SEP)
    print(f"Loading: {CSV_PATH}")
    df = load_csv(CSV_PATH)
    print(f"Shape   : {df.shape[0]:,} rows × {df.shape[1]} columns")
    print(SEP)

    # ------------------------------------------------------------------
    # 1. Timestamp / timezone check
    # ------------------------------------------------------------------
    print("TIMESTAMPS")
    sample_ts = df["timestamp_wib"].iloc[0]
    utc_offset = sample_ts.utcoffset()
    offset_str = str(utc_offset) if utc_offset is not None else "unknown"
    tz_name    = str(sample_ts.tzinfo)

    print(f"  dtype      : {df['timestamp_wib'].dtype}")
    print(f"  timezone   : {tz_name}")
    print(f"  UTC offset : {offset_str}")
    print(f"  first      : {df['timestamp_wib'].min()}")
    print(f"  last       : {df['timestamp_wib'].max()}")

    assert "+07:00" in str(sample_ts.isoformat()) or "UTC+07" in tz_name or "Asia/Jakarta" in tz_name, \
        "FAIL: timestamps are NOT in WIB (+07:00)!"
    print("  [OK] Timestamps are WIB (+07:00)")
    print(SEP)

    # ------------------------------------------------------------------
    # 2. Volume stats
    # ------------------------------------------------------------------
    print("VOLUME (volume_veh_per_hour)  — all approaches")
    v = df["volume_veh_per_hour"]
    print(f"  min  : {_fmt(v.min())}")
    print(f"  mean : {_fmt(v.mean())}")
    print(f"  max  : {_fmt(v.max())}")
    print(f"  std  : {_fmt(v.std())}")
    assert v.min() >= 0,    "FAIL: negative volume detected!"
    print("  [OK] All volume values ≥ 0")
    print(SEP)

    # ------------------------------------------------------------------
    # 3. Speed stats
    # ------------------------------------------------------------------
    print("SPEED (avg_speed_kmh)")
    s = df["avg_speed_kmh"]
    print(f"  min  : {_fmt(s.min())}")
    print(f"  mean : {_fmt(s.mean())}")
    print(f"  max  : {_fmt(s.max())}")
    assert s.min() >= 5,    "FAIL: speed below 5 km/h detected!"
    assert s.max() <= 80,   "FAIL: speed above 80 km/h detected!"
    print("  [OK] Speed within plausible range [5, 80] km/h")
    print(SEP)

    # ------------------------------------------------------------------
    # 4. Queue stats
    # ------------------------------------------------------------------
    print("QUEUE (queue_length_veh)")
    q = df["queue_length_veh"]
    print(f"  min  : {q.min()}")
    print(f"  mean : {_fmt(q.mean())}")
    print(f"  max  : {q.max()}")
    assert q.min() >= 0,    "FAIL: negative queue detected!"
    print("  [OK] Queue values ≥ 0")
    print(SEP)

    # ------------------------------------------------------------------
    # 5. Accident events
    # ------------------------------------------------------------------
    print("ACCIDENT EVENTS")
    acc_rows  = df[df["accident_count"] == 1]
    acc_ticks = df.groupby("tick")["accident_count"].first()
    acc_tick_count = int((acc_ticks == 1).sum())
    print(f"  Total rows with accident_count=1 : {len(acc_rows):,}")
    print(f"  Unique ticks under accident      : {acc_tick_count:,}")
    print(f"  Fraction of ticks affected       : {acc_tick_count / df['tick'].nunique():.1%}")
    print(SEP)

    # ------------------------------------------------------------------
    # 6. Roadwork / event flags
    # ------------------------------------------------------------------
    print("OTHER INCIDENT FLAGS")
    rw_ticks = int((df.groupby("tick")["roadwork_flag"].first() == 1).sum())
    ev_ticks = int((df.groupby("tick")["event_flag"].first() == 1).sum())
    total_ticks = df["tick"].nunique()
    print(f"  roadwork ticks : {rw_ticks:,} / {total_ticks:,}  ({rw_ticks/total_ticks:.1%})")
    print(f"  event ticks    : {ev_ticks:,} / {total_ticks:,}  ({ev_ticks/total_ticks:.1%})")
    print(SEP)

    # ------------------------------------------------------------------
    # 7. Weather distribution
    # ------------------------------------------------------------------
    print("WEATHER DISTRIBUTION")
    wc = (
        df.groupby("tick")["weather_condition"]
        .first()
        .value_counts()
        .rename_axis("condition")
        .reset_index(name="ticks")
    )
    wc["pct"] = (wc["ticks"] / total_ticks * 100).round(1)
    for _, row in wc.iterrows():
        print(f"  {row['condition']:<8} : {int(row['ticks']):>5} ticks  ({row['pct']}%)")
    print(SEP)

    # ------------------------------------------------------------------
    # 8.  Label sanity
    # ------------------------------------------------------------------
    print("TARGET LABELS")
    for col in ("target_volume_15m", "target_volume_2h", "target_volume_4h"):
        null_pct = df[col].isna().mean() * 100
        print(f"  {col:<24}  nulls={null_pct:.1f}%  "
              f"min={_fmt(df[col].min())}  mean={_fmt(df[col].mean())}  max={_fmt(df[col].max())}")
    print(SEP)

    # ------------------------------------------------------------------
    # 9. Sample rows (10)
    # ------------------------------------------------------------------
    print("SAMPLE (10 rows, sorted by tick then approach)")
    sample = (
        df.sort_values(["tick", "approach"])
        .head(10)[[
            "timestamp_wib", "tick", "approach",
            "vehicle_count_1min", "avg_speed_kmh",
            "queue_length_veh", "density_percent",
            "weather_condition", "accident_count",
        ]]
    )
    # Pretty-print without pandas truncation
    col_widths = {c: max(len(c), sample[c].astype(str).str.len().max()) for c in sample.columns}
    header = "  ".join(f"{c:<{col_widths[c]}}" for c in sample.columns)
    print(f"  {header}")
    print(f"  {'-' * len(header)}")
    for _, row in sample.iterrows():
        line = "  ".join(f"{str(row[c]):<{col_widths[c]}}" for c in sample.columns)
        print(f"  {line}")
    print(SEP)

    print("All checks passed.")


if __name__ == "__main__":
    main()
