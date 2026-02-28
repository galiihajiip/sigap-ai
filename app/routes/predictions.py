import json
import os
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

from app.state_store import store
from core.schemas import Prediction15m

router = APIRouter(tags=["predictions"])

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_ARTIFACT_DIR = os.path.join(_BASE_DIR, "ml", "artifacts")
_MODEL_PATH = os.path.join(_ARTIFACT_DIR, "sigap_model.h5")
_METRICS_PATH = os.path.join(_ARTIFACT_DIR, "lstm_metrics.json")
_TRAIN_META_PATH = os.path.join(_ARTIFACT_DIR, "train_meta.json")
_FEATURES_PATH = os.path.join(_ARTIFACT_DIR, "feature_columns.json")


def _load_json(path: str) -> Dict[str, Any]:
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get(
    "/intersections/{intersectionId}/prediction/15m",
    response_model=Prediction15m,
)
def get_prediction_15m(intersectionId: str) -> Prediction15m:
    pred = store.get_prediction15m(intersectionId)
    if pred is None:
        raise HTTPException(
            status_code=404,
            detail=f"No 15-minute prediction yet for intersection '{intersectionId}'.",
        )
    return pred


@router.get("/predictions/model-info")
def get_model_info() -> Dict[str, Any]:
    train_meta = _load_json(_TRAIN_META_PATH)
    metrics = _load_json(_METRICS_PATH)
    feature_payload = _load_json(_FEATURES_PATH)
    feature_columns = feature_payload.get("feature_columns", [])

    return {
        "modelName": "LSTM Neural Network",
        "modelFile": os.path.basename(_MODEL_PATH),
        "modelExists": os.path.exists(_MODEL_PATH),
        "modelSizeBytes": os.path.getsize(_MODEL_PATH) if os.path.exists(_MODEL_PATH) else 0,
        "sequenceLength": train_meta.get("seq_len"),
        "epochsRun": train_meta.get("epochs_run"),
        "bestEpoch": train_meta.get("best_epoch"),
        "bestValLoss": train_meta.get("best_val_loss"),
        "numFeatures": train_meta.get("num_features") or len(feature_columns),
        "featureColumns": feature_columns,
        "metrics": metrics,
    }


@router.get("/intersections/{intersectionId}/forecast")
def get_forecast(
    intersectionId: str,
    horizons: str = Query(default="2h,4h", description="Comma-separated horizon labels, e.g. 2h,4h"),
) -> Dict[str, Any]:
    requested = [h.strip() for h in horizons.split(",") if h.strip()]
    result: Dict[str, Any] = {}
    for horizon in requested:
        points = store.get_forecast(intersectionId, horizon)
        result[horizon] = points
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No forecast data yet for intersection '{intersectionId}'.",
        )
    return result
