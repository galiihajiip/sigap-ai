from typing import Any, Dict, List

from fastapi import APIRouter

from app.state_store import store
from core.schemas import NotificationItem

router = APIRouter(tags=["notifications"])


@router.get("/notifications", response_model=List[NotificationItem])
def get_notifications() -> List[NotificationItem]:
    return store.get_notifications()


@router.post("/notifications/mark-all-read")
def mark_all_read() -> Dict[str, Any]:
    marked = store.mark_all_notifications_read()
    return {"marked": marked}
