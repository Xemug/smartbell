# The API image for Cloud Run (built by Cloud Build in scripts/deploy.sh, so always linux/amd64).
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.9.16 /uv /bin/uv
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project
COPY . .
RUN uv sync --locked --no-dev
ENV PATH="/app/.venv/bin:$PATH" ENV=prod PYTHONUNBUFFERED=1
# Cloud Run sets PORT. Requests arrive through Firebase Hosting and Google's front end.
CMD exec uvicorn --factory smartbell.main:create_app --host 0.0.0.0 --port "${PORT:-8080}" \
    --proxy-headers --forwarded-allow-ips "*"
