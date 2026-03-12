#!/bin/bash
set -e

echo "=== Arkenos Backend Startup ==="
echo "PORT=${PORT:-8000}"
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo "DB_HOST=${DB_HOST:-not set}"

# Wait for database if DB_HOST is set (Docker Compose mode)
if [ -n "$DB_HOST" ]; then
    echo "Waiting for PostgreSQL at $DB_HOST..."
    while ! nc -z $DB_HOST 5432; do sleep 1; done
    echo "PostgreSQL ready!"
fi

# Wait for MinIO if MINIO_ENDPOINT is set (Docker Compose mode)
if [ -n "$MINIO_ENDPOINT" ]; then
    MINIO_HOST=$(echo "$MINIO_ENDPOINT" | cut -d: -f1)
    MINIO_PORT=$(echo "$MINIO_ENDPOINT" | cut -d: -f2)
    echo "Waiting for MinIO at $MINIO_HOST:$MINIO_PORT..."
    while ! nc -z $MINIO_HOST $MINIO_PORT; do sleep 1; done
    echo "MinIO ready!"
fi

# Test database connection with retries (handles Railway cold starts)
echo "Testing database connection..."
MAX_RETRIES=30
RETRY_COUNT=0
until python -c "
from sqlalchemy import create_engine, text
from app.config import get_settings
s = get_settings()
engine = create_engine(s.database_url)
with engine.connect() as conn:
    conn.execute(text('SELECT 1'))
print(f'DB connected: {s.database_url[:40]}...')
"; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "DATABASE CONNECTION FAILED after $MAX_RETRIES attempts"
        exit 1
    fi
    echo "DB not ready (attempt $RETRY_COUNT/$MAX_RETRIES), retrying in 2s..."
    sleep 2
done

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
