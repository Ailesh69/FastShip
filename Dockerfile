# syntax=docker/dockerfile:1

FROM python:3.14-slim AS builder

WORKDIR /app

# asyncpg/cryptography etc. may need to compile from source if no prebuilt
# wheel exists yet for this Python version - build tools live only in this
# stage and never reach the final image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


FROM python:3.14-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN groupadd -r app && useradd -r -g app app

COPY --from=builder /install /usr/local

COPY main.py config.py utils.py tag.py alembic.ini ./
COPY api ./api
COPY core ./core
COPY Database ./Database
COPY services ./services
COPY schemas ./schemas
COPY worker ./worker
COPY migrations ./migrations
COPY templates ./templates
COPY static ./static


# The Celery worker uses this same image with the command overridden to
# `celery -A worker.tasks worker --loglevel=info` (e.g. in docker-compose) -
# this default CMD is for the API process only.
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
RUN chown -R app:app /app
USER app 
EXPOSE 8000
CMD ["./entrypoint.sh"]