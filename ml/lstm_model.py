"""
ml/lstm_model.py
----------------
Defines the multi-horizon LSTM model for Sigap AI traffic volume forecasting.

Architecture:
    Input  (SEQ_LEN, num_features)
    → LSTM(64, return_sequences=True)
    → Dropout(0.2)
    → LSTM(32, return_sequences=False)
    → Dense(32, relu)
    → Dense(3, linear)          # [volume_proxy_15m, volume_proxy_2h, volume_proxy_4h]

Public API
----------
build_model(num_features, seq_len, learning_rate) -> tf.keras.Model
"""

from __future__ import annotations

import os
import sys

# Ensure project root is on path when running as a script
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

# Suppress TF info/warning logs before import
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

from ml.lstm_dataset import SEQ_LEN

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_DEFAULT_LR    = 1e-3
_LSTM1_UNITS   = 64
_LSTM2_UNITS   = 32
_DENSE_UNITS   = 32
_DROPOUT_RATE  = 0.2
_NUM_OUTPUTS   = 3   # horizons: H15, H2H, H4H


# ---------------------------------------------------------------------------
# Model builder
# ---------------------------------------------------------------------------

def build_model(
    num_features: int,
    seq_len: int = SEQ_LEN,
    learning_rate: float = _DEFAULT_LR,
) -> keras.Model:
    """
    Build and compile the multi-horizon LSTM model.

    Parameters
    ----------
    num_features : int
        Number of input features per time step (must match lstm_dataset output).
    seq_len : int
        Length of the input sequence window (default: SEQ_LEN = 60).
    learning_rate : float
        Adam learning rate (default: 1e-3).

    Returns
    -------
    tf.keras.Model
        Compiled model, ready for `model.fit(X, y)`.
        Input shape  : (batch, seq_len, num_features)
        Output shape : (batch, 3)  — [y_15m, y_2h, y_4h]
    """
    inputs = keras.Input(shape=(seq_len, num_features), name="traffic_sequence")

    x = layers.LSTM(
        _LSTM1_UNITS,
        return_sequences=True,
        name="lstm_1",
    )(inputs)

    x = layers.Dropout(_DROPOUT_RATE, name="dropout_1")(x)

    x = layers.LSTM(
        _LSTM2_UNITS,
        return_sequences=False,
        name="lstm_2",
    )(x)

    x = layers.Dense(_DENSE_UNITS, activation="relu", name="dense_1")(x)

    outputs = layers.Dense(_NUM_OUTPUTS, activation="linear", name="output")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="sigap_lstm")

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss=keras.losses.Huber(),      # robust to outliers; similar to MAE for small errors
        metrics=[keras.metrics.MeanAbsoluteError(name="mae")],
    )

    return model


# ---------------------------------------------------------------------------
# Quick self-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import numpy as np

    # Build with both level=total (23 features) and level=approach (27 features)
    for n_feat in (23, 27):
        m = build_model(num_features=n_feat)
        m.summary()
        print(f"  Input  : {m.input_shape}")
        print(f"  Output : {m.output_shape}")
        # Smoke-test with zero batch
        import numpy as np
        dummy_X = np.zeros((4, SEQ_LEN, n_feat), dtype=np.float32)
        pred = m.predict(dummy_X, verbose=0)
        assert pred.shape == (4, 3), f"Unexpected output shape: {pred.shape}"
        print(f"  Predict OK — shape {pred.shape}\n")

    print("build_model self-test passed.")
