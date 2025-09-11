# Docker Deployment Guide

This guide explains how to deploy the Incubator full-stack application using Docker and Docker Compose.

## Project Structure

The application consists of:
- **Backend**: Django REST API (located in `env/incubator/`)
- **Frontend**: Next.js application (located in `Frontend/`)
- **Database**: PostgreSQL
- **Cache**: Redis (optional)

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB of available RAM
- Available ports: 8000 (web), 5432 (postgres), 6379 (redis)

### 1. Build and Run with Docker Compose

```bash
# Clone and navigate to the project
cd /path/to/G-SVR-500-COT-5-1-survivor-10

# Navigate to docker directory
cd docker

# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 2. Access the Application

- **Django Admin**: http://localhost:8000/admin/
  - Username: `admin`
  - Password: `admin123`
- **API Documentation**: http://localhost:8000/swagger/ (if configured)
- **Application**: http://localhost:8000/

## Configuration

### Environment Variables

You can override default settings by creating a `.env` file:

```bash
# .env file
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://username:password@host:port/dbname
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com
REDIS_URL=redis://redis:6379/0
```

### Production Deployment

For production, modify the `docker/docker-compose.yml`:

```yaml
services:
  web:
    environment:
      - DEBUG=False
      - SECRET_KEY=your-production-secret-key
      - ALLOWED_HOSTS=yourdomain.com
```

## Docker Commands

**Note**: All Docker commands should be run from the `docker/` directory.

### Development Workflow

```bash
# Build the application
docker-compose build

# Start services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs web
docker-compose logs postgres

# Access container shell
docker-compose exec web bash
docker-compose exec postgres psql -U incubator_user -d incubator_db
```

### Database Management

```bash
# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Load fixtures/seed data
docker-compose exec web python manage.py loaddata your-fixture.json

# Database backup
docker-compose exec postgres pg_dump -U incubator_user incubator_db > backup.sql
```

### Frontend Development

The Next.js frontend is built during the Docker build process. If you need to work on the frontend:

```bash
# For frontend development, you might want to run it separately:
cd Frontend
npm install
npm run dev  # This runs on port 3000

# The backend API will still be available on port 8000
```

## File Structure in Container

```
/app/
├── manage.py                 # Django management script
├── incubator/               # Django project settings
├── users/                   # Django apps
├── startups/
├── ...
├── static/                  # Frontend static files
│   └── frontend/
│       ├── .next/          # Next.js build output
│       └── public/         # Public assets
├── staticfiles/            # Collected Django static files
├── logs/                   # Application logs
├── docker_settings.py      # Production Django settings
└── docker-entrypoint.sh    # Startup script
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :8000
   lsof -i :5432
   
   # Stop conflicting services or change ports in docker/docker-compose.yml
   ```

2. **Database connection issues**
   ```bash
   # Check database status
   docker-compose ps
   docker-compose logs postgres
   
   # Reset database
   docker-compose down -v
   docker-compose up --build
   ```

3. **Permission issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x docker-entrypoint.sh
   ```

4. **Frontend build failures**
   ```bash
   # Clear npm cache and rebuild
   docker-compose build --no-cache
   
   # Check Node.js/npm versions in the container
   docker-compose run --rm web node --version
   docker-compose run --rm web npm --version
   ```

### Debugging

1. **View container logs**
   ```bash
   docker-compose logs -f web
   ```

2. **Access container shell**
   ```bash
   docker-compose exec web bash
   ```

3. **Check Django configuration**
   ```bash
   docker-compose exec web python manage.py check
   docker-compose exec web python manage.py showmigrations
   ```

## Performance Optimization

### Production Optimizations

1. **Use production WSGI server** (modify Dockerfile CMD):
   ```dockerfile
   CMD ["gunicorn", "--bind", "0.0.0.0:8000", "incubator.wsgi:application"]
   ```

2. **Add Nginx reverse proxy** (create nginx service in docker/docker-compose.yml)

3. **Enable caching** (Redis is already configured)

4. **Static file serving** (use nginx for static files in production)

### Resource Limits

Add resource limits to docker/docker-compose.yml:

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

## Security Considerations

1. **Change default credentials** before production
2. **Set strong SECRET_KEY** in environment variables
3. **Use SSL certificates** for HTTPS
4. **Configure firewall** to restrict access to necessary ports
5. **Regular security updates** of base images
6. **Environment-specific settings** (separate dev/staging/prod configurations)

## Monitoring

Consider adding monitoring services:
- **Application monitoring**: Sentry, DataDog
- **Infrastructure monitoring**: Prometheus + Grafana
- **Log aggregation**: ELK stack or similar

For questions or issues, check the application logs or contact the development team.
