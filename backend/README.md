# CampusPulse AI Backend

FastAPI modular monolith for the CampusPulse AI platform.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
python -m app.database.seed
uvicorn app.main:app --reload
```

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
