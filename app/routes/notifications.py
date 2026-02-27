from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["notifications"])


@router.get("/notifications")
def get_notifications() -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})


@router.post("/notifications/mark-all-read")
def mark_all_read() -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})
