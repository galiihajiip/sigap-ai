from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["cameras"])


@router.get("/cameras")
def get_cameras() -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})
