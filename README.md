# SIGAP AI

Smart traffic management platform with:
- real-time intersection simulation,
- AI-assisted recommendations,
- interactive operator dashboard,
- analytics and decision logging.

This repository contains both:
- `FastAPI` backend (`/app`, `/core`, `/ml`, `/sim`, `/weather`)
- `React + Vite` frontend (`/sigap-frontend`)

## Why This Project

SIGAP AI is designed to help traffic operators:
- monitor congestion in real time,
- receive AI recommendations for signal timing,
- apply or reject recommendations with operator control,
- track outcomes through analytics and decision logs.

## Key Features

- Real-time traffic state updates (2-second ticks).
- AI recommendation workflow:
  - `Apply AI Adjustment`
  - `Reject`
  - confirmation prompt before critical actions.
- Manual signal override controls.
- Prediction and forecast endpoints.
- Heatmap and decision log analytics.
- Notification and settings APIs.
- BMKG weather integration with fallback behavior.

## Tech Stack

- Backend: `Python`, `FastAPI`, `Uvicorn`, `Pydantic`
- ML/Data: `TensorFlow`, `scikit-learn`, `XGBoost`, `pandas`, `numpy`
- Frontend: `React 19`, `Vite`, `Tailwind CSS`, `Recharts`, `Axios`

## Repository Structure

```text
sigap/
├─ app/                    # FastAPI app, routes, runtime tick loop
├─ core/                   # Shared config, schemas, utility contracts
├─ ml/                     # Model training/inference and artifacts
├─ sim/                    # Traffic simulation logic
├─ weather/                # Weather provider services (BMKG/fallback)
├─ data/                   # Dummy/sample datasets
├─ scripts/                # Utility scripts (sanity checks, training helper)
├─ sigap-frontend/         # React frontend
├─ requirements.txt        # Python dependencies
└─ README.md
```

## Quick Start (For Judges)

If you only need to run and evaluate quickly, follow this section.

### 1) Start Backend

From project root:

```bash
python -m venv .venv
```

Activate environment:

```bash
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Windows (CMD)
.venv\Scripts\activate.bat

# macOS/Linux
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run API server:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok"}
```

### 2) Start Frontend

Open a new terminal:

```bash
cd sigap-frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

`http://127.0.0.1:5173`

### 3) Demo Login

Use this demo account on the login page:

- Email: `demo@sigapai.com`
- Password: `demo1234`

### 4) Judge Flow Suggestion (3-5 Minutes)

1. Open Dashboard and verify live data refresh.
2. Trigger AI action:
   - click `Apply AI Adjustment` and confirm `Yes`,
   - or click `Reject` and confirm `Yes`.
3. Check Analytics/Decision Log updates.
4. Open Profile and verify admin UI content.
5. (Optional) Check API docs at `http://127.0.0.1:8000/docs`.

## API Overview

Base URL:

`http://127.0.0.1:8000/api`

Main endpoints:

- `GET /system`
- `GET /intersections`
- `GET /intersections/{intersectionId}/live`
- `POST /intersections/{intersectionId}/adjust`
- `GET /intersections/{intersectionId}/prediction/15m`
- `GET /intersections/{intersectionId}/forecast?horizons=2h,4h`
- `GET /predictions/model-info`
- `GET /recommendations/top`
- `POST /recommendations/{recommendationId}/apply`
- `POST /recommendations/{recommendationId}/reject`
- `GET /analytics/heatmap`
- `GET /analytics/decision-log`
- `GET /notifications`
- `POST /notifications/mark-all-read`
- `GET /settings`
- `PUT /settings`

## Configuration Notes

Core config lives in:

`core/config.py`

Notable defaults:
- API prefix: `/api`
- Tick interval: every `2` seconds
- Timezone: `Asia/Jakarta`
- CORS enabled for local frontend (`localhost:5173`, `127.0.0.1:5173`)

## Local Development Tips

- Backend default URL for frontend is:
  - `http://127.0.0.1:8000`
- Frontend can be pointed to another API using:
  - `VITE_API_BASE` in your Vite environment.
- If ports are busy, stop existing processes first or run on different ports.

## Troubleshooting

- `Cannot connect to backend`:
  - ensure backend is running on `127.0.0.1:8000`.
- Frontend shows stale content:
  - hard refresh browser (`Ctrl+F5`).
- CORS issues:
  - run frontend on allowed local origins (`5173` or `3000`).
- Dependency install problems:
  - use current `Node.js LTS` and Python `3.10+` (recommended).

## Production Note

This repository is optimized for demo/development workflows.  
For production deployment, add:
- environment-based secrets/config,
- proper auth and RBAC,
- persistent storage,
- structured logging/monitoring,
- CI/CD and containerization.
