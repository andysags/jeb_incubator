# Docker Configuration

This folder contains all Docker-related files for the Survivor application.

## Files

- `Dockerfile.nextjs` - Next.js production build
- `Dockerfile.nextjs.dev` - Next.js development with hot reloading
- `Dockerfile.django` - Django backend
- `docker-compose.yml` - Full-stack orchestration

## Usage

All commands should be run from the `docker/` directory:

```bash
cd docker/
```

### Quick Start

**Full Development Stack:**
```bash
docker-compose up frontend-dev backend db
```

**Production Stack:**
```bash
docker-compose up frontend-prod backend db
```

### Individual Services

**Frontend Only:**
```bash
# Development
docker-compose up frontend-dev

# Production
docker-compose up frontend-prod
```

**Backend Only:**
```bash
docker-compose up backend db
```

**Database Only:**
```bash
docker-compose up db
```

### Management Commands

```bash
# Stop all services
docker-compose down

# Rebuild containers
docker-compose build

# View logs
docker-compose logs -f frontend-dev
docker-compose logs -f backend

# Execute commands in containers
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### Build Individual Images

**Frontend:**
```bash
# Development
docker build -f Dockerfile.nextjs.dev -t survivor-frontend-dev ..

# Production
docker build -f Dockerfile.nextjs -t survivor-frontend-prod ..
```

**Backend:**
```bash
docker build -f Dockerfile.django -t survivor-backend ..
```

## Services

When running, services will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin
- **Database**: localhost:5432

## Environment

The compose file is configured to:
- Use the parent directory as build context
- Mount volumes for development hot reloading (Django: `../env/incubator:/app`)
- Set up networking between services
- Persist database data with volumes

## Project Structure

The Django backend is located at `../env/incubator/` relative to this docker folder.
