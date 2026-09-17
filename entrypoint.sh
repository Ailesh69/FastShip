#!/bin/bash
set -e
alembic stamp head
alembic upgrade head
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}