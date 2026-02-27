from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["system"])


@router.get("/system")
def get_system() -> JSONResponse:
    return JSONResponse(status_code=501, content={"detail": "Not implemented yet."})
