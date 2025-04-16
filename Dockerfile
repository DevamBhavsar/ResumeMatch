# Frontend build stage
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm@10.8.1

# Copy frontend files
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ ./
RUN pnpm build

# Backend stage
FROM python:3.9-slim
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=backend/app.py \
    FLASK_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements file
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_md

# Copy backend files
COPY backend/ ./backend/

# Copy built frontend files
COPY --from=frontend-build /app/frontend/out /app/backend/static/frontend

# Create necessary directories
RUN mkdir -p backend/data/processed backend/logs

# Expose port
EXPOSE 5000

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend.app:app"]
