from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["recommendations"])


@router.get("/recommendations/top")
def get_recommendations_top() -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})


@router.post("/recommendations/{recommendationId}/apply")
def apply_recommendation(recommendationId: str) -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})


@router.post("/recommendations/{recommendationId}/reject")
def reject_recommendation(recommendationId: str) -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})
