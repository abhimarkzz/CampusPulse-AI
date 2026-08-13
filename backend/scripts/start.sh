#!/usr/bin/env bash
set -euo pipefail
echo "Running migrations..."
alembic upgrade head
echo "Seeding demo data (idempotent)..."
python -m app.database.seed || true
echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
