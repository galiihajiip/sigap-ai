"""
scripts/train_lstm_from_dummy.py
---------------------------------
One-command training trigger for the Sigap AI LSTM model.

Run from the project root:
    python scripts/train_lstm_from_dummy.py [--epochs 50] [--level total]

Actions:
    1. Calls ml/train_lstm.train() with supplied args.
    2. Verifies all expected artifact files exist.
    3. Prints "TRAIN OK" or raises with a clear error message.
"""

from __future__ import annotations

import argparse
import os
import sys

# ---------------------------------------------------------------------------
# Project root on path
# ---------------------------------------------------------------------------
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

# ---------------------------------------------------------------------------
# Expected artifacts after a successful training run
# ---------------------------------------------------------------------------
_ARTIFACTS_DIR = os.path.join(_ROOT, "ml", "artifacts")
_REQUIRED_ARTIFACTS = [
    "sigap_model.h5",
    "lstm_metrics.json",
    "scaler.joblib",
    "feature_columns.json",
    "weather_encoder.json",
]


def _verify_artifacts() -> None:
    """Raise RuntimeError listing any missing artifact files."""
    missing = [
        f for f in _REQUIRED_ARTIFACTS
        if not os.path.exists(os.path.join(_ARTIFACTS_DIR, f))
    ]
    if missing:
        raise RuntimeError(
            "Training completed but the following artifacts are missing:\n"
            + "\n".join(f"  ✗  ml/artifacts/{f}" for f in missing)
        )
    print("\nArtifact verification:")
    for f in _REQUIRED_ARTIFACTS:
        path = os.path.join(_ARTIFACTS_DIR, f)
        size_kb = os.path.getsize(path) / 1024
        print(f"  ✓  ml/artifacts/{f}  ({size_kb:.1f} KB)")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Train Sigap LSTM from dummy data (one-command)"
    )
    parser.add_argument(
        "--level", choices=["total", "approach"], default="total",
        help="Aggregation level (default: total)",
    )
    parser.add_argument(
        "--epochs", type=int, default=50,
        help="Max training epochs (default: 50)",
    )
    parser.add_argument(
        "--batch", type=int, default=64,
        help="Batch size (default: 64)",
    )
    parser.add_argument(
        "--patience", type=int, default=5,
        help="EarlyStopping patience (default: 5)",
    )
    args = parser.parse_args()

    # ------------------------------------------------------------------
    # Step 1: Run training
    # ------------------------------------------------------------------
    from ml.train_lstm import train

    print("=" * 60)
    print("  Sigap AI — LSTM Training from Dummy Data")
    print("=" * 60)

    metrics = train(
        level=args.level,
        epochs=args.epochs,
        batch_size=args.batch,
        patience=args.patience,
    )

    # ------------------------------------------------------------------
    # Step 2: Verify artifacts
    # ------------------------------------------------------------------
    _verify_artifacts()

    # ------------------------------------------------------------------
    # Step 3: Print metrics summary
    # ------------------------------------------------------------------
    print("\nTest metrics summary:")
    for horizon in ("15m", "2h", "4h"):
        mae  = metrics.get(f"mae_{horizon}", "N/A")
        mape = metrics.get(f"mape_{horizon}", "N/A")
        rmse = metrics.get(f"rmse_{horizon}", "N/A")
        print(f"  {horizon:<4}  MAE={mae:.4f}  MAPE={mape:.2f}%  RMSE={rmse:.4f}")

    print("\nTRAIN OK")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"\nTRAIN FAILED: {exc}", file=sys.stderr)
        sys.exit(1)
