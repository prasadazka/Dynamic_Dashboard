# syntax=docker/dockerfile:1.6

# ---------- Stage 1: build the React/Vite frontend ----------
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: Python backend serving API + static SPA ----------
FROM python:3.11-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Minimal build deps for pandas/numpy wheels (most are prebuilt for slim images)
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements-prod.txt ./backend/requirements-prod.txt
RUN pip install -r backend/requirements-prod.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/dist ./frontend_dist/

# Cloud Run sets PORT; default to 8080 for local docker runs
ENV PORT=8080
EXPOSE 8080

# Run with one worker — Cloud Run scales horizontally, not by process count.
CMD exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}
