from fastapi import APIRouter, HTTPException

from app.state_store import store
from core.schemas import SystemStatus

router = APIRouter(tags=["system"])


@router.get("/system", response_model=SystemStatus)
def get_system() -> SystemStatus:
    status = store.get_system_status()
    if status is None:
        raise HTTPException(status_code=503, detail="System status not yet available.")
    return status
