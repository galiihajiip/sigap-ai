from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["analytics"])


@router.get("/analytics/heatmap")
def get_heatmap(days: int = 7) -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})


@router.get("/analytics/decision-log")
def get_decision_log(limit: int = 100) -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})
