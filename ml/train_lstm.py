"""
ml/train_lstm.py
----------------
Trains the Sigap AI LSTM multi-horizon model and saves all artifacts.

Run from the project root:
    python ml/train_lstm.py [--level total|approach] [--epochs 50] [--batch 64]

Outputs (in ml/artifacts/):
    sigap_model.h5          trained Keras model
    scaler.joblib           StandardScaler fitted on train split
    feature_columns.json    ordered feature list + level tag
    weather_encoder.json    weather one-hot mapping
    lstm_metrics.json       MAE / MAPE / RMSE per horizon on test split
"""

from __future__ import annotations

import argparse
import json
import os
import sys

# ---------------------------------------------------------------------------
# Path & env setup before heavy imports
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import numpy as np
import tensorflow as tf
from tensorflow import keras

from ml.data_loader import load_csv
from ml.lstm_dataset import build_sequences, SEQ_LEN
from ml.lstm_model import build_model

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_ARTIFACTS = os.path.join(_HERE, "artifacts")
_CSV = os.path.join(_ROOT, "data", "dummy_traffic_7d.csv")
HORIZON_NAMES = ["15m", "2h", "4h"]


# ---------------------------------------------------------------------------
# Metrics helpers
# ---------------------------------------------------------------------------

def _mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(np.abs(y_true - y_pred)))


def _mape(y_true: np.ndarray, y_pred: np.ndarray, eps: float = 1.0) -> float:
    """Mean Absolute Percentage Error; eps guards against division by zero."""
    denom = np.maximum(np.abs(y_true), eps)
    return float(np.mean(np.abs(y_true - y_pred) / denom) * 100.0)


def _rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


# ---------------------------------------------------------------------------
# Main training routine
# ---------------------------------------------------------------------------

def train(
    level: str = "total",
    epochs: int = 50,
    batch_size: int = 64,
    patience: int = 5,
) -> dict:
    """
    Full train → evaluate → save pipeline.

    Returns
    -------
    dict
        Evaluation metrics (same structure as lstm_metrics.json).
    """
    print(f"\n{'='*60}")
    print(f"  Sigap LSTM Training   level={level!r}  epochs={epochs}")
    print(f"{'='*60}\n")

    # ------------------------------------------------------------------
    # 1. Load dataset
    # ------------------------------------------------------------------
    print(f"[1/5] Loading dataset: {_CSV}")
    df = load_csv(_CSV)
    print(f"      Rows: {len(df):,}  |  Columns: {df.shape[1]}")

    # ------------------------------------------------------------------
    # 2. Build sequences (also saves scaler/encoder artifacts)
    # ------------------------------------------------------------------
    print(f"[2/5] Building sequences (SEQ_LEN={SEQ_LEN}) …")
    X_train, y_train, X_val, y_val, X_test, y_test = build_sequences(
        df, level=level, artifacts_dir=_ARTIFACTS
    )
    num_features = X_train.shape[2]
    print(f"      train={X_train.shape}  val={X_val.shape}  test={X_test.shape}")
    print(f"      features={num_features}")

    # ------------------------------------------------------------------
    # 3. Build model
    # ------------------------------------------------------------------
    print(f"[3/5] Building model …")
    model = build_model(num_features=num_features)
    model.summary(print_fn=lambda s: print(f"      {s}"))

    # ------------------------------------------------------------------
    # 4. Train
    # ------------------------------------------------------------------
    print(f"\n[4/5] Training …")
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=patience,
            restore_best_weights=True,
            verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-6,
            verbose=1,
        ),
    ]

    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=1,
    )

    best_epoch = int(np.argmin(history.history["val_loss"])) + 1
    best_val_loss = float(min(history.history["val_loss"]))
    print(f"\n      Best epoch: {best_epoch}  |  best val_loss: {best_val_loss:.4f}")

    # ------------------------------------------------------------------
    # 5. Save model
    # ------------------------------------------------------------------
    os.makedirs(_ARTIFACTS, exist_ok=True)
    model_path = os.path.join(_ARTIFACTS, "sigap_model.h5")
    model.save(model_path)
    print(f"\n[5/5] Model saved → {model_path}")

    # ------------------------------------------------------------------
    # 6. Evaluate on test set
    # ------------------------------------------------------------------
    print("\n--- Test Evaluation ---")
    y_pred = model.predict(X_test, verbose=0)   # [N, 3]

    metrics: dict[str, float] = {}
    rows: list[str] = []
    header = f"  {'Horizon':<8}  {'MAE':>10}  {'MAPE %':>10}  {'RMSE':>10}"
    rows.append(header)
    rows.append("  " + "-" * (len(header) - 2))

    for i, name in enumerate(HORIZON_NAMES):
        yt = y_test[:, i]
        yp = y_pred[:, i]
        mae_v  = _mae(yt, yp)
        mape_v = _mape(yt, yp)
        rmse_v = _rmse(yt, yp)

        metrics[f"mae_{name}"]  = round(mae_v,  4)
        metrics[f"mape_{name}"] = round(mape_v, 4)
        metrics[f"rmse_{name}"] = round(rmse_v, 4)

        rows.append(
            f"  {name:<8}  {mae_v:>10.3f}  {mape_v:>10.2f}  {rmse_v:>10.3f}"
        )

    for row in rows:
        print(row)

    # ------------------------------------------------------------------
    # 7. Save metrics JSON
    # ------------------------------------------------------------------
    metrics_path = os.path.join(_ARTIFACTS, "lstm_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\n  Metrics saved → {metrics_path}")

    # Also record training metadata
    meta = {
        "level":      level,
        "seq_len":    SEQ_LEN,
        "epochs_run": len(history.history["val_loss"]),
        "best_epoch": best_epoch,
        "best_val_loss": round(best_val_loss, 6),
        "num_features": num_features,
    }
    meta_path = os.path.join(_ARTIFACTS, "train_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"  Metadata  saved → {meta_path}")
    print(f"\nDone.\n")

    return metrics


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train Sigap LSTM model")
    parser.add_argument(
        "--level", choices=["total", "approach"], default="total",
        help="Aggregation level for sequences (default: total)",
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
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    train(
        level=args.level,
        epochs=args.epochs,
        batch_size=args.batch,
        patience=args.patience,
    )
