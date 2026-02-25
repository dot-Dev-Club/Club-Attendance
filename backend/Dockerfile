# ──────────────────────────────────────────────
# FastAPI + Uvicorn backend
# ──────────────────────────────────────────────
FROM python:3.12-slim

# Prevent .pyc files and force stdout/stderr to be unbuffered
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install OS-level deps (needed for some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# The SQLite DB file lives in /data so it can be mounted as a named volume
RUN mkdir -p /data
ENV DATABASE_URL=sqlite:////data/club_attendance.db

EXPOSE 8000

# Run with auto-reload disabled in production
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
