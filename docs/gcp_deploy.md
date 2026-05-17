# Deploying to GCP Cloud Run

The backend reads config from environment variables via `backend/config.py`.
In production, **do not ship a `.env` file** — Cloud Run injects env vars
directly, and the secret comes from GCP Secret Manager.

## 1. One-time GCP setup

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

## 2. Store the Groq key in Secret Manager

```bash
# Create the secret (one time)
printf "YOUR_REAL_GROQ_KEY" | gcloud secrets create GROQ_API_KEY \
  --data-file=- \
  --replication-policy=automatic

# To rotate later, add a new version:
printf "NEW_KEY" | gcloud secrets versions add GROQ_API_KEY --data-file=-
```

Grant the Cloud Run service account read access:

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding GROQ_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 3. Build and deploy

```bash
# From the repo root
gcloud run deploy adaptive-data-platform \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --set-env-vars "GROQ_MODEL=llama-3.3-70b-versatile,DEBUG=False,LOG_LEVEL=INFO" \
  --update-secrets "GROQ_API_KEY=GROQ_API_KEY:latest"
```

What each flag does:
- `--set-env-vars` — non-secret config, visible in the console
- `--update-secrets` — pulls the named Secret Manager secret and exposes it as
  an env var named `GROQ_API_KEY`. The app code is unchanged — `os.environ`
  sees it like any other variable.
- `--memory 1Gi` — pandas + LangChain need headroom; bump higher for big CSVs.

## 4. Updating env vars without redeploying code

```bash
# Change the model
gcloud run services update adaptive-data-platform \
  --region us-central1 \
  --set-env-vars "GROQ_MODEL=llama-3.1-8b-instant"

# Point to a new secret version
gcloud run services update adaptive-data-platform \
  --region us-central1 \
  --update-secrets "GROQ_API_KEY=GROQ_API_KEY:2"
```

## 5. Verify

```bash
SERVICE_URL=$(gcloud run services describe adaptive-data-platform \
  --region us-central1 --format='value(status.url)')
curl "${SERVICE_URL}/docs"   # FastAPI Swagger UI
```

## Notes

- **`.env` is not deployed.** `config.py` already falls back to system env
  vars when no file is found — Cloud Run's injected vars work directly.
- **Frontend** is currently wired to `/api` via the Vite dev proxy. For
  production you either need to (a) serve the built frontend from the same
  Cloud Run service (FastAPI `StaticFiles`), or (b) host it on Firebase
  Hosting and add a rewrite to the Cloud Run service. That's separate from
  this `.env` setup.
- **CORS** in `backend/main.py` is currently `allow_origins=["*"]` with
  `allow_credentials=True` — browsers reject that combo. Before going live,
  restrict origins to your frontend domain.
