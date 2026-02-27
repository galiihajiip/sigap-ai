from typing import List

from fastapi import APIRouter

from app.state_store import store
from core.schemas import CameraFeedCard

router = APIRouter(tags=["cameras"])


@router.get("/cameras", response_model=List[CameraFeedCard])
def get_cameras() -> List[CameraFeedCard]:
    return store.get_cameras()
