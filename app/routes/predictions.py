from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["predictions"])


@router.get("/intersections/{intersectionId}/prediction/15m")
def get_prediction_15m(intersectionId: str) -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})


@router.get("/intersections/{intersectionId}/forecast")
def get_forecast(intersectionId: str, horizons: str = "2h,4h") -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})
