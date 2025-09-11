# Multi-stage Dockerfile for Django + Next.js Application
# Stage 1: Build the Frontend (Next.js)
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY Frontend/package*.json ./
COPY Frontend/tsconfig.json ./
COPY Frontend/next.config.js ./
COPY Frontend/tailwind.config.js ./
COPY Frontend/postcss.config.js ./
COPY Frontend/postcss.config.mjs ./
COPY Frontend/eslint.config.mjs ./

# Install frontend dependencies (need devDeps for build)
RUN npm ci

# Copy frontend source code
COPY Frontend/ ./

# Build the Next.js application
RUN npm run build

# Stage 2: Setup Python Backend
FROM python:3.11-slim AS backend

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=incubator.settings

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy Django project
COPY env/incubator/ ./

# Copy production settings and entrypoint
COPY docker/docker_settings.py ./
COPY docker/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Copy built frontend from the previous stage
COPY --from=frontend-builder /app/frontend/.next ./static/frontend/.next/
COPY --from=frontend-builder /app/frontend/public ./static/frontend/public/

# Create necessary directories
RUN mkdir -p staticfiles logs

# Create a non-root user for security
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

# Expose ports
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/admin/ || exit 1

# Set entrypoint and default command
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
