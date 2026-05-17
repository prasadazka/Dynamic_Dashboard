from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
    title="Adaptive Data Intelligence Platform",
    description="Transform CSV data into actionable insights through domain-adaptive analytics and natural language interaction",
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
# `html=True` makes StaticFiles fall back to index.html for client-side routes.
# Mounted last so the /api/* router and /healthz take precedence.
_FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend_dist")
if os.path.isdir(_FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=_FRONTEND_DIST, html=True), name="spa")
else:
    @app.get("/")
    async def root():
        return {"message": "API only — frontend bundle not present", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level=LOG_LEVEL.lower())
