# CampusPulse AI

AI-Powered Campus Complaint & Service Intelligence Platform.

## Features

- JWT authentication with RBAC (student, staff, admin)
- Complaint CRUD with AI-assisted classification
- Status workflow with valid transitions
- Comments, upvotes, followers, similar complaint detection
- SLA policies and risk tracking
- Real-time WebSocket endpoint
- Notifications system
- AI Campus Assistant chat
- Issue clustering and AI insights
- Analytics dashboard with charts
- Campus map with building hotspots
- Admin command center and audit logs
- Docker Compose for local development
- CI pipeline for frontend and backend

## Quick Start (VS Code)

```bash
cp .env.example .env
docker compose up -d postgres redis

# Terminal 1 - Backend
cd backend && source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
python -m app.database.seed
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev
```

- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@campus.local | Student123! |
| Staff | staff@campus.local | Staff123! |
| Admin | admin@campus.local | Admin123! |

## API Overview

- `/api/v1/auth` — register, login, me
- `/api/v1/complaints` — CRUD, status, comments, upvotes
- `/api/v1/categories`, `/departments`, `/locations/*`
- `/api/v1/analytics` — dashboard, trends, insights
- `/api/v1/notifications`
- `/api/v1/ai` — assistant, classify, clusters
- `/api/v1/admin` — overview, live complaints, audit
- `/ws` — WebSocket realtime

## AI Provider

Configure via `.env`:
```
AI_PROVIDER=mock   # default, works offline
OPENAI_API_KEY=    # optional future provider
GEMINI_API_KEY=    # optional future provider
```

## Project Structure

```
frontend/   React + Vite + Tailwind
backend/    FastAPI modular monolith
docker-compose.yml
.github/workflows/ci.yml
```

## Deploy

### Frontend — Netlify (1 click)

Repo: **https://github.com/abhimarkzz/CampusPulse-AI**

1. Open [Netlify deploy from GitHub](https://app.netlify.com/start/deploy?repository=https://github.com/abhimarkzz/CampusPulse-AI)
2. Sign in → select **CampusPulse-AI** repo → Deploy site
3. `netlify.toml` is already configured (builds `frontend/`, SPA redirects included)

After deploy, set **Site settings → Environment variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | Your backend URL (see below) |

### Backend — Render (recommended)

Netlify hosts the frontend only. Deploy the API on [Render](https://render.com):

1. New **Blueprint** → connect `abhimarkzz/CampusPulse-AI`
2. Uses `render.yaml` (PostgreSQL + FastAPI)
3. After deploy, run seed once in Render shell: `python -m app.database.seed`
4. Copy the Render URL → paste into Netlify `VITE_API_BASE_URL`
5. Update Render `CORS_ORIGINS` to your Netlify URL (e.g. `https://campuspulse-ai.netlify.app`)

## Stitch Design

Export `DESIGN.md` from Google Stitch and connect MCP via `.cursor/mcp.json` to align UI with your design system.
