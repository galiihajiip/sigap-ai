from typing import Any, Dict

from fastapi import APIRouter

from app.state_store import store
from core.schemas import SettingsPayload
from core.time_utils import wib_now_iso

router = APIRouter(tags=["settings"])


@router.get("/settings", response_model=SettingsPayload)
def get_settings() -> SettingsPayload:
    return store.get_settings()


@router.put("/settings")
def update_settings(payload: SettingsPayload) -> Dict[str, Any]:
    store.update_settings(payload)
    return {"saved": True, "updatedAt": wib_now_iso()}
