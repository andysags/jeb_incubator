# Survivor Full-Stack Application

This is a full-stack application with a [Next.js](https://nextjs.org) frontend and Django backend, fully containerized with Docker.

## Project Structure

```
├── src/                    # Next.js frontend source
│   ├── components/         # React components
│   ├── pages/             # Next.js pages
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Layout components
│   └── services/          # API services
├── backend/
│   └── env/incubator/     # Django backend
│       ├── events/        # Django events app
│       ├── files/         # Django files app
│       └── incubator/     # Django main project
├── docker/                # Docker configuration
│   ├── Dockerfile.nextjs  # Next.js production build
│   ├── Dockerfile.nextjs.dev # Next.js development
│   ├── Dockerfile.django  # Django backend (Python 3.13)
│   ├── docker-compose.yml # Full-stack orchestration
│   ├── docker-compose.override.yml # Development overrides
│   ├── init.sql          # Database initialization script
│   └── setup_database.sh # Django database setup script
├── public/                # Static assets
└── docs/                  # Documentation
```

## Docker Setup

This project includes complete Docker configuration for both development and production environments.

### Files Overview

All Docker files are located in the `docker/` folder:

- `docker/Dockerfile.nextjs` - Next.js production build
- `docker/Dockerfile.nextjs.dev` - Next.js development with hot reloading
- `docker/Dockerfile.django` - Django backend
- `docker/docker-compose.yml` - Full-stack orchestration
- `.dockerignore` - Excludes unnecessary files

## Quick Start

**Important**: All Docker commands must be run from the `docker/` directory:

```bash
cd docker/
```

### First Time Setup (Database Initialization)

For the **first run**, initialize the database with proper setup:

```bash
# Initialize database and start all services
docker-compose --profile init up --build
```

This will:
- Build all Docker images
- Create PostgreSQL database with proper permissions
- Run Django migrations
- Create database indexes
- Set up cron jobs (if configured)
- Create admin superuser (username: `admin`, password: `admin123`)

### Regular Development

After initial setup, use for daily development:

```bash
# Start both frontend and backend
docker-compose up frontend-dev backend

# Or run in detached mode
docker-compose up -d frontend-dev backend
```

**Services will be available at:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

### With Database (PostgreSQL)

```bash
# Start all services including database
docker-compose up frontend-dev backend db
```

**Services will be available at:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Database: `localhost:5432`

### Production Environment

```bash
# Build and run production containers
docker-compose up frontend-prod backend db
```

## Individual Service Commands

### Frontend Only (Next.js)

```bash
# Development
docker-compose up frontend-dev

# Production
docker-compose up frontend-prod
```

### Backend Only (Django)

```bash
# Backend with database
docker-compose up backend db
```

### Database Only

```bash
# PostgreSQL only
docker-compose up db
```

## Manual Docker Commands

From the `docker/` directory:

### Frontend

```bash
# Build development image
docker build -f Dockerfile.nextjs.dev -t survivor-frontend-dev ..

# Run development container
docker run -p 3000:3000 -v $(pwd)/..:/app -v /app/node_modules survivor-frontend-dev

# Build production image
docker build -f Dockerfile.nextjs -t survivor-frontend-prod ..

# Run production container
docker run -p 3000:3000 survivor-frontend-prod
```

### Backend

```bash
# Build Django image
docker build -f Dockerfile.django -t survivor-backend ..

# Run Django container
docker run -p 8000:8000 survivor-backend
```

## Environment Configuration

### Frontend Environment Variables

Create `.env.local` for Next.js:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Survivor App
```

### Backend Environment Variables

Django settings are configured in `backend/env/incubator/incubator/settings.py`

### Database Configuration

PostgreSQL credentials (configured in docker-compose.yml):
- Database: `jeb`
- User: `merchex_user`
- Password: `merchex_pass`
- Host: `db` (within Docker network) or `localhost:5432` (from host)
- Python version: 3.13
- PostgreSQL version: 15

**Note**: Database configuration follows specifications from `installation.md`

## Development Workflow

### Local Development Without Docker

**Frontend:**
```bash
npm install
npm run dev
```

**Backend:**
```bash
cd backend/env/incubator
pip install -r ../../../requirements.txt
python manage.py runserver
```

### With Docker (Recommended)

**Note**: Remember to run Docker commands from the `docker/` directory:

```bash
cd docker/

# Start development environment
docker-compose up frontend-dev backend

# View logs
docker-compose logs -f frontend-dev
docker-compose logs -f backend

# Execute commands in containers
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec frontend-dev npm install new-package
```

## Key Features

### Frontend (Next.js)
- ✅ React 19 with TypeScript
- ✅ Tailwind CSS for styling
- ✅ Hot reloading in development
- ✅ Production optimized builds
- ✅ Turbopack for faster builds

### Backend (Django)
- ✅ Django 5.2.5 with Python 3.13
- ✅ Events and Files apps
- ✅ REST API ready
- ✅ PostgreSQL support with automatic setup
- ✅ Admin interface at `/admin`
- ✅ API synchronization with external services
- ✅ Cron job management with django-crontab
- ✅ Auto-installed packages: djangorestframework, django-cors-headers, psycopg2-binary, requests

### Docker Features
- ✅ Multi-stage builds for optimization
- ✅ Security best practices (non-root users)
- ✅ Development hot reloading
- ✅ Production optimized images
- ✅ Database persistence with volumes

## Common Commands

### Container Management

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild containers
docker-compose build

# Rebuild without cache
docker-compose build --no-cache
```

### Django Management

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic

# Django shell
docker-compose exec backend python manage.py shell
```

### Database Management

```bash
# Access PostgreSQL
docker-compose exec db psql -U merchex_user -d jeb

# Backup database
docker-compose exec db pg_dump -U merchex_user jeb > backup.sql

# Restore database
docker-compose exec -T db psql -U merchex_user -d jeb < backup.sql

# Run API synchronization
docker-compose exec backend python manage.py sync_all --pretty

# Manage cron jobs
docker-compose exec backend python manage.py crontab add
docker-compose exec backend python manage.py crontab show
docker-compose exec backend python manage.py crontab remove
```

## Troubleshooting

### Port Conflicts

If ports are already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Frontend on port 3001
  - "8001:8000"  # Backend on port 8001
  - "5433:5432"  # Database on port 5433
```

### Clear Docker Cache

```bash
# Remove unused images and cache
docker system prune -a

# Remove specific containers and images
docker-compose down --rmi all
```

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs frontend-dev
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend
```

### Django Debug

```bash
# Check Django apps
docker-compose exec backend python manage.py check

# Show migrations
docker-compose exec backend python manage.py showmigrations

# Run tests
docker-compose exec backend python manage.py test
```

## API Endpoints

With the Django backend running, you can access:

- Admin interface: `http://localhost:8000/admin/`
- Events API: `http://localhost:8000/events/`
- Files API: `http://localhost:8000/files/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker: `docker-compose up frontend-dev backend`
5. Submit a pull request

## Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### Django Resources
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)

### Docker Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
