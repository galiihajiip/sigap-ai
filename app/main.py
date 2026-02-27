from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import APP_NAME, API_PREFIX
from app.routes import (
    system,
    cameras,
    intersections,
    predictions,
    recommendations,
    analytics,
    notifications,
    settings,
)

app = FastAPI(title=APP_NAME)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(system.router, prefix=API_PREFIX)
app.include_router(cameras.router, prefix=API_PREFIX)
app.include_router(intersections.router, prefix=API_PREFIX)
app.include_router(predictions.router, prefix=API_PREFIX)
app.include_router(recommendations.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)
app.include_router(settings.router, prefix=API_PREFIX)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
