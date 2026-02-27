from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["settings"])


@router.get("/settings")
def get_settings() -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})


@router.put("/settings")
def update_settings() -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})
