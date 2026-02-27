from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["intersections"])


@router.get("/intersections")
def get_intersections() -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})


@router.get("/intersections/{intersectionId}/live")
def get_intersection_live(intersectionId: str) -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})


@router.post("/intersections/{intersectionId}/adjust")
def adjust_intersection(intersectionId: str) -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})
