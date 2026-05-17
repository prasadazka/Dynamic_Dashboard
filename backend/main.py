from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import numpy as np
from tempfile import NamedTemporaryFile
import shutil
import os
import uuid
import logging
from typing import Dict, Any, List, Optional
import json
import sys

# Add the parent directory to the path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import configuration
from backend.config import DEBUG, LOG_LEVEL

# Initialize logging
log_level = getattr(logging, LOG_LEVEL)
logging.basicConfig(level=log_level)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Savant AI",
    description="Upload a CSV and Savant AI infers the domain, builds a tailored dashboard, and answers questions about your data in plain English.",
    version="1.0.0",
    debug=DEBUG
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Import API router
from backend.api.routes import router

# Include API routes
app.include_router(router)

@app.get("/healthz")
async def healthz():
    return {"status": "ok", "version": "1.0.0"}


# Serve the built React/Vite SPA from the same Cloud Run service.
#
# This is a catch-all route registered LAST so the /api/* and /healthz routes
# above take precedence. We avoid `app.mount("/", StaticFiles)` because
# Starlette's root mount intercepts requests before FastAPI route resolution,
# 404'ing /api/* and /healthz even though they're registered.
_FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend_dist")
if os.path.isdir(_FRONTEND_DIST):
    _INDEX_HTML = os.path.join(_FRONTEND_DIST, "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):
        # Path-traversal guard: normalize and require the result stays inside dist.
        candidate = os.path.normpath(os.path.join(_FRONTEND_DIST, full_path))
        if (
            full_path
            and candidate.startswith(_FRONTEND_DIST)
            and os.path.isfile(candidate)
        ):
            return FileResponse(candidate)
        return FileResponse(_INDEX_HTML)
else:
    @app.get("/")
    async def root():
        return {"message": "API only — frontend bundle not present", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level=LOG_LEVEL.lower())
