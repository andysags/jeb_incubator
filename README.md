🇬🇧 English | 🇫🇷 [Français](README.fr.md)

# JEB Incubator

A full-stack web platform that showcases startups from the JEB incubator and connects them with investors and partners. It has a Next.js frontend, a Django REST API, PostgreSQL, and a scheduled sync from the external JEB API.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white)
![Django REST Framework](https://img.shields.io/badge/DRF-REST_API-A30000?logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)

## About

The project brief (`G-SVR-500_project.pdf`) asks for a web platform that showcases projects from a startup incubator. The platform should give startups visibility, connect them with investors, partners and clients, and keep project information up to date.

This repository implements that platform:

- A public catalog of startups, news, events and opportunities.
- User accounts with roles (`admin`, `startup`, `investor`).
- Messaging between users.
- An admin dashboard for managing content.
- A backend job that imports startups, users, investors, partners, news and events from the JEB API every two hours.

<!-- TODO: add screenshot -->

## Key features

- **Startup catalog**: list and profile pages for startups, plus founders, investors and partners (`/api/startups/`, `/api/founders/`, `/api/investors/`, `/api/partners/`).
- **News, events and opportunities**: CRUD REST endpoints. Writes are restricted to admins through an `IsAdminOrReadOnly` permission.
- **Authentication**: register, log in and fetch the current user (`/api/auth/register/`, `/api/auth/login/`, `/api/auth/me/`). Login returns an HS256 JWT signed with the Django `SECRET_KEY`.
- **Role-based UI**: a `RequireRole` component and the `usePersonalizedNavigation` hook adapt pages and navigation to the user's role.
- **Messaging**: conversations, messages, unread count and mark-as-read endpoints.
- **Admin dashboard**: overview stats, user, startup, news and event management, and charts (Recharts). It is served by Next.js API routes that query PostgreSQL directly.
- **External API sync**: the `sync_all` management command imports data from the JEB API. It runs every 2 hours through `django-crontab` or a `flock`-guarded shell script.
- **Audit and import tracing**: `audit_log` and `import_api` tables record actions and the raw payload of each imported record.

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Frontend | Next.js 15 (Pages Router), React 19, TypeScript, Tailwind CSS 3, Radix UI primitives, lucide-react, Recharts, styled-components |
| Frontend server routes | Next.js API routes with `pg` (node-postgres) |
| Backend | Django 5.2, Django REST Framework, django-cors-headers, django-crontab, PyJWT, requests, dj-database-url |
| Database | PostgreSQL (via `psycopg`) |
| Tooling | ESLint, a multi-stage Dockerfile (Node 18 + Python 3.11), Procfile for gunicorn |

## Notable technical choices

- **Database-first models.** Most Django models map onto an existing PostgreSQL schema with `managed = False` (`users`, `news`, `events`, `opportunities`, `files`, `messages`, `audit_log`). Django reads and writes these tables but does not create or alter them.
- **Idempotent sync.** Each `sync_*` function in `import_api/services.py` upserts records and keeps one trace row per `(source, cible_type, remote_id)`, removing duplicate trace rows. `sync_all` isolates failures per entity, so one failing import does not stop the others.
- **Password hashing on save.** `Utilisateur.save()` checks whether the password is already a Django hash (`identify_hasher`) and hashes it (PBKDF2) if not. The `hash_passwords` command migrates existing plain-text values.
- **Configurable SQL in Next.js API routes.** Admin routes read table and column names from environment variables (`STARTUPS_TABLE`, `NEWS_TITLE_COLUMN`, …) and validate each identifier with a strict `^[a-zA-Z0-9_]+$` check (`sanitizeIdentifier`) before building queries.
- **Cron safety.** `scripts/sync_all.sh` aborts if migrations are pending, uses `flock` to prevent overlapping runs, and logs to `logs/sync_all.log`.

## Architecture

```mermaid
flowchart LR
    U[Browser] --> FE[Next.js frontend<br/>Frontend/]
    FE -- "REST /api/* (NEXT_PUBLIC_API_BASE)" --> BE[Django REST API<br/>env/incubator/]
    FE -- "Next.js API routes /api/admin/*<br/>(pg)" --> DB[(PostgreSQL)]
    BE --> DB
    CRON[django-crontab / scripts/sync_all.sh<br/>every 2 h] --> SYNC[manage.py sync_all]
    SYNC -- "X-Group-Authorization" --> JEB[JEB API<br/>api.jeb-incubator.com]
    SYNC --> DB
```

## Project status and known issues

The repository is a snapshot of team project work. Before you run it, note the following:

- **Missing `authentication` app.** `settings.py` lists `authentication` in `INSTALLED_APPS`, and `news`, `events` and `opportunities` import `authentication.permissions.IsAdminOrReadOnly`. That package is not in the repository, so you must add it before Django can start.
- **`requirements.txt` does not list the backend dependencies.** It is a system package freeze with no Django in it. Install the packages listed in [Install the backend](#2-install-the-backend) instead.
- **Configuration is hard-coded.** The database URL, `SECRET_KEY`, `JEB_API_TOKEN`, `DEBUG = True` and `ALLOWED_HOSTS` are set directly in `env/incubator/incubator/settings.py`. Point them at your own values; see [Configure the backend](#3-configure-the-backend).
- **The Docker setup is incomplete.** `docker/docker-compose.yml` is empty. `docker/Dockerfile` exists, but no Compose stack has been set up around it.
- **The `Procfile` does not match the module name.** It references `jeb.wsgi:application`, but the WSGI module is `incubator.wsgi`.
- **The Django project lives inside the virtualenv folder.** It is under `env/incubator/`, and the committed `env/` also contains virtualenv files (`env/bin`, `env/lib`, `pyvenv.cfg`). Only `env/incubator/` is project source.

## Getting started

### Prerequisites

- Python 3.13 (the version used to create the original virtualenv)
- Node.js 18 or later and npm (the Dockerfile uses Node 18)
- PostgreSQL 14 or later (version recommended in `Frontend/installation.md`)

### 1. Clone the repository

```bash
git clone https://github.com/andysags/jeb_incubator.git
cd jeb_incubator
```

### 2. Install the backend

Use a virtualenv outside `env/`, so you don't mix it with the committed files:

```bash
python3.13 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install "django>=5.2,<5.3" djangorestframework django-cors-headers django-crontab \
            dj-database-url "psycopg[binary]" requests PyJWT certifi
```

### 3. Configure the backend

Edit `env/incubator/incubator/settings.py`:

- Set `DATABASES` to your own PostgreSQL instance, for example `dj_database_url.parse("postgresql://USER:PASSWORD@localhost:5432/jeb")`.
- Add `localhost` and `127.0.0.1` to `ALLOWED_HOSTS`.
- Replace `SECRET_KEY` and `JEB_API_TOKEN` with your own values.

At startup, `settings.py` also loads `KEY=VALUE` lines from `env/incubator/.env` into the process environment. The settings below read the environment:

| Variable | Read by | Purpose |
|----------|---------|---------|
| `MESSAGERIES_ALLOW_ANONYMOUS` | `messageries/views.py` | When set, messaging endpoints allow unauthenticated access (dev only). |
| `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, `DATABASE_URL`, `REDIS_URL` | `docker/docker_settings.py` | Overrides for the Docker settings module. |
| `JEB_API_TOKEN` | `scripts/sync_all.sh` (via the root `.env`) | Token for the JEB API, if it is not set in `settings.py`. |

The database is used database-first: most tables must already exist. `Frontend/installation.md` (in French) covers creating the role and granting privileges. Then apply migrations:

```bash
cd env/incubator
python manage.py migrate --fake-initial
```

### 4. Run the backend

```bash
cd env/incubator
python manage.py runserver 0.0.0.0:8000
```

### 5. Install and run the frontend

```bash
cd Frontend
npm install
npm run dev        # http://localhost:3000
```

Create `Frontend/.env.local` with the variables the code reads:

| Variable | Purpose | Default in code |
|----------|---------|-----------------|
| `NEXT_PUBLIC_API_BASE` | Base URL of the Django API, used by most pages | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_API_URL` | Base URL used by `src/services/api.ts` | `http://localhost:8000` |
| `NEXT_PUBLIC_BASE_URL` | Absolute base URL for server-side fetches in the admin dashboard | empty |
| `DATABASE_URL` | PostgreSQL connection string for Next.js API routes | none |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGSSL` | Used instead of `DATABASE_URL` when it is missing | `localhost`, `5432` |
| `STARTUPS_*`, `USERS_*`, `NEWS_*`, `EVENTS_*`, `FOUNDERS_*`, `INVESTORS_TABLE` | Optional table and column name overrides for admin API routes | see `src/pages/api/admin/*.ts` |

Other frontend scripts:

```bash
npm run build      # production build (output: standalone)
npm run start      # serve the production build
npm run lint       # ESLint
```

## Usage

### REST API (Django, prefix `/api/`)

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST auth/register/`, `POST auth/login/`, `GET auth/me/` (header `Authorization: Bearer <token>`) |
| Users | `utilisateurs/` |
| Startups ecosystem | `startups/`, `founders/`, `investors/`, `partners/` |
| Content | `actualites/` (news), `evenements/` (events), `opportunites/` (opportunities), `fichiers/` (files) |
| Admin news | `admin/recent-news`, `admin/news` |
| Messaging | `messages/`, `conversations/`, `messages/unread_count/`, `messages/mark_read/` |
| Tracing | `auditlogs/`, `import-api/` |

Example:

```bash
curl http://127.0.0.1:8000/api/startups/
```

### Sync data from the JEB API

```bash
python env/incubator/manage.py sync_all --pretty       # one-off run, pretty-printed JSON result
python env/incubator/manage.py crontab add             # schedule every 2 hours (minute 5)
python env/incubator/manage.py crontab show
./scripts/sync_all.sh                                  # cron-friendly wrapper with flock + logging
```

## Project structure

```
jeb_incubator/
├── Frontend/                 # Next.js app
│   ├── src/
│   │   ├── pages/            # Pages Router: home, startups, news, events, opportunities, messages, admin…
│   │   │   └── api/          # Next.js API routes (admin/*, auth/register, me/startup) using pg
│   │   ├── components/       # UI components (components/ui = Radix-based primitives)
│   │   ├── hooks/            # useAuth, useFetch, usePersonalizedNavigation, useProjects
│   │   ├── services/         # API clients
│   │   └── lib/db.ts         # PostgreSQL pool + identifier sanitizing
│   └── installation.md       # Detailed setup guide (French)
├── env/incubator/            # Django project (the rest of env/ is a committed virtualenv)
│   ├── incubator/            # settings, urls, wsgi/asgi
│   ├── users/  startups/  news/  events/  opportunities/
│   ├── messageries/  files/  logs/
│   └── import_api/           # JEB API sync services + sync_all command
├── scripts/                  # sync_all.sh (cron wrapper), SQL helper
├── docker/                   # Dockerfile, entrypoint, Docker settings, Docker guide
├── G-SVR-500_project.pdf     # Project brief
└── Procfile
```

## Tests

The project has no automated tests. Each Django app has a placeholder `tests.py`, and the frontend has no test script. You can run ESLint with `npm run lint` in `Frontend/`.
