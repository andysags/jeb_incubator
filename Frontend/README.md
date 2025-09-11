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

## 🐳 Configuration Docker

Cette configuration Docker permet de déployer facilement l'application sur n'importe quel système d'exploitation supportant Docker.

### 🚀 Démarrage rapide

#### Prérequis
- Docker (version 20.10+)
- Docker Compose (version 2.0+)

#### Installation
1. **Naviguer vers le dossier docker**
   ```bash
   cd docker
   ```

2. **Configurer l'environnement**
   ```bash
   cp env.example .env
   # Modifier le fichier .env selon vos besoins
   ```

3. **Démarrer l'application**
   ```bash
   ./scripts/start.sh
   ```

L'application sera accessible sur :
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Admin Django: http://localhost:8000/admin

### 📁 Structure Docker

```
docker/
├── docker-compose.yml          # Configuration principale
├── docker-compose.override.yml # Configuration de développement
├── Dockerfile.backend          # Image Docker pour Django
├── Dockerfile.frontend         # Image Docker pour Next.js
├── nginx.conf                  # Configuration Nginx
├── entrypoint.sh              # Script d'initialisation Django
├── env.example                # Template de configuration
├── init.sql                   # Script d'initialisation PostgreSQL
└── scripts/
    ├── start.sh               # Script de démarrage général
    ├── dev.sh                 # Script de développement
    └── prod.sh                # Script de production
```

### 🛠️ Scripts disponibles

#### Script principal (`start.sh`)
```bash
./scripts/start.sh [COMMAND]
```

**Commandes disponibles :**
- `start` - Démarrer tous les services (par défaut)
- `stop` - Arrêter tous les services
- `restart` - Redémarrer tous les services
- `build` - Construire les images
- `logs` - Afficher les logs
- `status` - Afficher le statut des services
- `clean` - Nettoyer les volumes et images
- `shell` - Ouvrir un shell dans le conteneur backend
- `db` - Ouvrir un shell PostgreSQL

#### Script de développement (`dev.sh`)
```bash
./scripts/dev.sh [COMMAND]
```

**Commandes disponibles :**
- `start` - Démarrer l'environnement de développement
- `install` - Installer les dépendances
- `test` - Exécuter les tests
- `lint` - Linter le code
- `build` - Construire l'application

#### Script de production (`prod.sh`)
```bash
./scripts/prod.sh [COMMAND]
```

**Commandes disponibles :**
- `deploy` - Déployer l'application en production
- `build` - Construire les images de production
- `health` - Vérifier la santé des services
- `backup` - Sauvegarder la base de données
- `restore` - Restaurer la base de données
- `logs` - Surveiller les logs
- `update` - Mettre à jour l'application
- `cleanup` - Nettoyer les ressources
- `stats` - Afficher les statistiques

### 🔧 Configuration

#### Variables d'environnement

Copiez `env.example` vers `.env` et configurez les variables suivantes :

```bash
# Configuration de base
DEBUG=False
SECRET_KEY=your-secret-key-here

# Base de données PostgreSQL
POSTGRES_DB=incubator
POSTGRES_USER=incubator_user
POSTGRES_PASSWORD=incubator_password
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=redis_password
REDIS_PORT=6379

# Ports des services
BACKEND_PORT=8000
FRONTEND_PORT=3000
NGINX_PORT=80
NGINX_SSL_PORT=443

# URLs publiques
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### Services inclus

- **PostgreSQL 16** - Base de données principale
- **Redis 7** - Cache et sessions
- **Django Backend** - API REST
- **Next.js Frontend** - Interface utilisateur
- **Nginx** - Reverse proxy (production uniquement)

### 🚀 Déploiement

#### Développement
```bash
# Démarrer l'environnement de développement
./scripts/dev.sh start

# Ou utiliser Docker Compose directement
docker-compose up -d
```

#### Production
```bash
# Déployer en production
./scripts/prod.sh deploy

# Ou utiliser Docker Compose avec le profil production
docker-compose --profile production up -d
```

### 📊 Monitoring et maintenance

#### Vérifier la santé des services
```bash
./scripts/prod.sh health
```

#### Surveiller les logs
```bash
./scripts/prod.sh logs
```

#### Sauvegarder la base de données
```bash
./scripts/prod.sh backup
```

#### Restaurer la base de données
```bash
./scripts/prod.sh restore backup_20240101_120000.sql
```

### 🔍 Dépannage

#### Problèmes courants

1. **Port déjà utilisé**
   ```bash
   # Vérifier les ports utilisés
   docker-compose ps
   
   # Modifier les ports dans .env
   BACKEND_PORT=8001
   FRONTEND_PORT=3001
   ```

2. **Base de données non accessible**
   ```bash
   # Vérifier les logs de la base de données
   docker-compose logs db
   
   # Redémarrer la base de données
   docker-compose restart db
   ```

3. **Images non construites**
   ```bash
   # Forcer la reconstruction
   docker-compose build --no-cache
   ```

#### Logs détaillés
```bash
# Logs de tous les services
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

#### Accès aux conteneurs
```bash
# Shell dans le backend
./scripts/start.sh shell

# Shell PostgreSQL
./scripts/start.sh db

# Ou directement
docker-compose exec backend /bin/bash
docker-compose exec db psql -U incubator_user -d incubator
```

### 🔒 Sécurité

#### Production
- Changez tous les mots de passe par défaut
- Utilisez des certificats SSL valides
- Configurez un firewall approprié
- Activez les logs de sécurité
- Mettez à jour régulièrement les images

### 📈 Performance

#### Optimisations recommandées
1. **Images multi-stage** - Réduisent la taille des images
2. **Cache des dépendances** - Accélèrent les builds
3. **Volumes nommés** - Améliorent les performances I/O
4. **Health checks** - Assurent la disponibilité des services
5. **Ressources limitées** - Évitent la surconsommation

#### Monitoring
```bash
# Statistiques des conteneurs
./scripts/prod.sh stats

# Utilisation des ressources
docker stats

# Espace disque
docker system df
```

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
