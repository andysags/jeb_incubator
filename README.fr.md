🇬🇧 [English](README.md) | 🇫🇷 Français

# JEB Incubator

Une plateforme web full-stack qui présente les startups de l'incubateur JEB et les met en relation avec des investisseurs et des partenaires. Elle comprend un frontend Next.js, une API REST Django, PostgreSQL et une synchronisation planifiée depuis l'API externe JEB.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white)
![Django REST Framework](https://img.shields.io/badge/DRF-REST_API-A30000?logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)

## À propos

Le cahier des charges (`G-SVR-500_project.pdf`) demande une plateforme web qui met en valeur les projets d'un incubateur de startups. Elle doit donner de la visibilité aux startups, les mettre en relation avec des investisseurs, des partenaires et des clients, et tenir à jour les informations sur les projets.

Ce dépôt implémente cette plateforme :

- Un catalogue public de startups, d'actualités, d'événements et d'opportunités.
- Des comptes utilisateurs avec des rôles (`admin`, `startup`, `investor`).
- Une messagerie entre utilisateurs.
- Un tableau de bord d'administration pour gérer le contenu.
- Une tâche backend qui importe toutes les deux heures les startups, utilisateurs, investisseurs, partenaires, actualités et événements depuis l'API JEB.

<!-- TODO: add screenshot -->

## Fonctionnalités principales

- **Catalogue de startups** : pages de liste et de profil des startups, ainsi que fondateurs, investisseurs et partenaires (`/api/startups/`, `/api/founders/`, `/api/investors/`, `/api/partners/`).
- **Actualités, événements et opportunités** : endpoints REST CRUD. L'écriture est réservée aux administrateurs par une permission `IsAdminOrReadOnly`.
- **Authentification** : inscription, connexion et récupération de l'utilisateur courant (`/api/auth/register/`, `/api/auth/login/`, `/api/auth/me/`). La connexion renvoie un JWT HS256 signé avec la `SECRET_KEY` de Django.
- **Interface selon le rôle** : le composant `RequireRole` et le hook `usePersonalizedNavigation` adaptent les pages et la navigation au rôle de l'utilisateur.
- **Messagerie** : endpoints pour les conversations, les messages, le nombre de messages non lus et le marquage comme lu.
- **Tableau de bord admin** : statistiques globales, gestion des utilisateurs, des startups, des actualités et des événements, et graphiques (Recharts). Il est servi par des routes API Next.js qui interrogent directement PostgreSQL.
- **Synchronisation avec l'API externe** : la commande de gestion `sync_all` importe les données de l'API JEB. Elle s'exécute toutes les 2 heures via `django-crontab` ou un script shell protégé par `flock`.
- **Traçabilité des actions et des imports** : les tables `audit_log` et `import_api` enregistrent les actions et le payload brut de chaque enregistrement importé.

## Stack technique

| Couche | Technologies |
|--------|--------------|
| Frontend | Next.js 15 (Pages Router), React 19, TypeScript, Tailwind CSS 3, primitives Radix UI, lucide-react, Recharts, styled-components |
| Routes serveur du frontend | Routes API Next.js avec `pg` (node-postgres) |
| Backend | Django 5.2, Django REST Framework, django-cors-headers, django-crontab, PyJWT, requests, dj-database-url |
| Base de données | PostgreSQL (via `psycopg`) |
| Outillage | ESLint, Dockerfile multi-stage (Node 18 + Python 3.11), Procfile pour gunicorn |

## Choix techniques notables

- **Modèles « database-first ».** La plupart des modèles Django correspondent à un schéma PostgreSQL existant avec `managed = False` (`users`, `news`, `events`, `opportunities`, `files`, `messages`, `audit_log`). Django lit et écrit dans ces tables, mais ne les crée pas et ne les modifie pas.
- **Synchronisation idempotente.** Chaque fonction `sync_*` de `import_api/services.py` fait un upsert des enregistrements et conserve une seule ligne de trace par `(source, cible_type, remote_id)`, en supprimant les doublons de trace. `sync_all` isole les erreurs par entité : un import en échec n'interrompt pas les autres.
- **Hachage du mot de passe à l'enregistrement.** `Utilisateur.save()` vérifie si le mot de passe est déjà un hash Django (`identify_hasher`) et le hache (PBKDF2) sinon. La commande `hash_passwords` migre les valeurs existantes stockées en clair.
- **SQL configurable dans les routes API Next.js.** Les routes d'administration lisent les noms de tables et de colonnes dans des variables d'environnement (`STARTUPS_TABLE`, `NEWS_TITLE_COLUMN`, …) et valident chaque identifiant avec une règle stricte `^[a-zA-Z0-9_]+$` (`sanitizeIdentifier`) avant de construire les requêtes.
- **Cron sécurisé.** `scripts/sync_all.sh` s'arrête si des migrations sont en attente, utilise `flock` pour empêcher les exécutions concurrentes et écrit ses logs dans `logs/sync_all.log`.

## Architecture

```mermaid
flowchart LR
    U[Navigateur] --> FE[Frontend Next.js<br/>Frontend/]
    FE -- "REST /api/* (NEXT_PUBLIC_API_BASE)" --> BE[API REST Django<br/>env/incubator/]
    FE -- "Routes API Next.js /api/admin/*<br/>(pg)" --> DB[(PostgreSQL)]
    BE --> DB
    CRON[django-crontab / scripts/sync_all.sh<br/>toutes les 2 h] --> SYNC[manage.py sync_all]
    SYNC -- "X-Group-Authorization" --> JEB[API JEB<br/>api.jeb-incubator.com]
    SYNC --> DB
```

## État du projet et problèmes connus

Le dépôt est un instantané d'un projet d'équipe. Avant de le lancer, tenez compte des points suivants :

- **Application `authentication` manquante.** Le projet attend une application `authentication`, et `news`, `events` et `opportunities` importent `authentication.permissions.IsAdminOrReadOnly`. Ce package n'est pas dans le dépôt : vous devez l'ajouter pour que Django démarre.
- **`requirements.txt` ne liste pas les dépendances du backend.** C'est un export de paquets système qui ne contient pas Django. Installez plutôt les paquets indiqués dans [Installer le backend](#2-installer-le-backend).
- **`settings.py` est actuellement vide.** `env/incubator/incubator/settings.py` a été vidé pour retirer des identifiants qui y avaient été commités. Django ne peut pas démarrer tant qu'il n'est pas recréé ; voir [Configurer le backend](#3-configurer-le-backend).
- **Configuration Docker incomplète.** `docker/docker-compose.yml` est vide. `docker/Dockerfile` existe, mais aucune stack Compose n'a été mise en place autour.
- **Le `Procfile` ne correspond pas au nom du module.** Il référence `jeb.wsgi:application`, alors que le module WSGI est `incubator.wsgi`.
- **Le projet Django se trouve dans le dossier du virtualenv.** Il est dans `env/incubator/`, et le dossier `env/` versionné contient aussi des fichiers de virtualenv (`env/bin`, `env/lib`, `pyvenv.cfg`). Seul `env/incubator/` contient le code source du projet.

## Démarrage

### Prérequis

- Python 3.13 (la version utilisée pour créer le virtualenv d'origine)
- Node.js 18 ou plus récent et npm (le Dockerfile utilise Node 18)
- PostgreSQL 14 ou plus récent (version recommandée dans `Frontend/installation.md`)

### 1. Cloner le dépôt

```bash
git clone https://github.com/andysags/jeb_incubator.git
cd jeb_incubator
```

### 2. Installer le backend

Utilisez un virtualenv en dehors de `env/` pour ne pas le mélanger avec les fichiers versionnés :

```bash
python3.13 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install "django>=5.2,<5.3" djangorestframework django-cors-headers django-crontab \
            dj-database-url "psycopg[binary]" requests PyJWT certifi
```

### 3. Configurer le backend

Recréez `env/incubator/incubator/settings.py` (il est actuellement vide). Lisez chaque secret depuis des variables d'environnement au lieu de l'écrire dans le fichier, pour ne plus rien commiter de sensible. Le fichier doit contenir au minimum :

- `INSTALLED_APPS` : `django.contrib.*` (admin, auth, contenttypes, sessions, messages, staticfiles), `rest_framework`, `corsheaders`, `django_crontab`, `users`, `startups`, `news`, `events`, `opportunities`, `messageries`, `files`, `logs`, `import_api`, `authentication`.
- `ROOT_URLCONF = "incubator.urls"`.
- `DATABASES` construit à partir d'une variable d'environnement `DATABASE_URL`, par exemple `dj_database_url.parse(os.environ["DATABASE_URL"])` avec `postgresql://USER:PASSWORD@localhost:5432/jeb`.
- `SECRET_KEY`, `JEB_API_TOKEN` et `DEBUG` lus depuis l'environnement, et `localhost` / `127.0.0.1` dans `ALLOWED_HOSTS`.
- `CRONJOBS = [("5 */2 * * *", "django.core.management.call_command", ["sync_all"])]` si vous voulez la synchronisation toutes les 2 heures via django-crontab.

`docker/docker_settings.py` importe ce module (`from env.incubator.incubator.settings import *`), donc la configuration Docker en dépend aussi. Le reste du code lit ces variables d'environnement :

| Variable | Lue par | Rôle |
|----------|---------|------|
| `MESSAGERIES_ALLOW_ANONYMOUS` | `messageries/views.py` | Si définie, les endpoints de messagerie acceptent les accès non authentifiés (développement uniquement). |
| `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, `DATABASE_URL`, `REDIS_URL` | `docker/docker_settings.py` | Valeurs de remplacement pour le module de settings Docker. |
| `JEB_API_TOKEN` | `scripts/sync_all.sh` (via le `.env` racine) | Jeton de l'API JEB utilisé par le script de synchronisation. |

La base fonctionne en « database-first » : la plupart des tables doivent déjà exister. `Frontend/installation.md` explique comment créer le rôle et accorder les droits. Appliquez ensuite les migrations :

```bash
cd env/incubator
python manage.py migrate --fake-initial
```

### 4. Lancer le backend

```bash
cd env/incubator
python manage.py runserver 0.0.0.0:8000
```

### 5. Installer et lancer le frontend

```bash
cd Frontend
npm install
npm run dev        # http://localhost:3000
```

Créez `Frontend/.env.local` avec les variables lues par le code :

| Variable | Rôle | Valeur par défaut dans le code |
|----------|------|--------------------------------|
| `NEXT_PUBLIC_API_BASE` | URL de base de l'API Django, utilisée par la plupart des pages | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_API_URL` | URL de base utilisée par `src/services/api.ts` | `http://localhost:8000` |
| `NEXT_PUBLIC_BASE_URL` | URL absolue pour les requêtes côté serveur du tableau de bord admin | vide |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL pour les routes API Next.js | aucune |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGSSL` | Utilisées à la place de `DATABASE_URL` si elle est absente | `localhost`, `5432` |
| `STARTUPS_*`, `USERS_*`, `NEWS_*`, `EVENTS_*`, `FOUNDERS_*`, `INVESTORS_TABLE` | Surcharges facultatives des noms de tables et de colonnes pour les routes API admin | voir `src/pages/api/admin/*.ts` |

Autres scripts du frontend :

```bash
npm run build      # build de production (output: standalone)
npm run start      # servir le build de production
npm run lint       # ESLint
```

## Utilisation

### API REST (Django, préfixe `/api/`)

| Ressource | Endpoints |
|-----------|-----------|
| Authentification | `POST auth/register/`, `POST auth/login/`, `GET auth/me/` (en-tête `Authorization: Bearer <token>`) |
| Utilisateurs | `utilisateurs/` |
| Écosystème startups | `startups/`, `founders/`, `investors/`, `partners/` |
| Contenus | `actualites/` (actualités), `evenements/` (événements), `opportunites/` (opportunités), `fichiers/` (fichiers) |
| Actualités admin | `admin/recent-news`, `admin/news` |
| Messagerie | `messages/`, `conversations/`, `messages/unread_count/`, `messages/mark_read/` |
| Traçabilité | `auditlogs/`, `import-api/` |

Exemple :

```bash
curl http://127.0.0.1:8000/api/startups/
```

### Synchroniser les données depuis l'API JEB

```bash
python env/incubator/manage.py sync_all --pretty       # exécution ponctuelle, résultat JSON formaté
python env/incubator/manage.py crontab add             # planifier toutes les 2 heures (minute 5)
python env/incubator/manage.py crontab show
./scripts/sync_all.sh                                  # wrapper adapté au cron, avec flock + logs
```

## Structure du projet

```
jeb_incubator/
├── Frontend/                 # Application Next.js
│   ├── src/
│   │   ├── pages/            # Pages Router : accueil, startups, actualités, événements, opportunités, messages, admin…
│   │   │   └── api/          # Routes API Next.js (admin/*, auth/register, me/startup) utilisant pg
│   │   ├── components/       # Composants UI (components/ui = primitives basées sur Radix)
│   │   ├── hooks/            # useAuth, useFetch, usePersonalizedNavigation, useProjects
│   │   ├── services/         # Clients API
│   │   └── lib/db.ts         # Pool PostgreSQL + validation des identifiants
│   └── installation.md       # Guide d'installation détaillé
├── env/incubator/            # Projet Django (le reste de env/ est un virtualenv versionné)
│   ├── incubator/            # settings, urls, wsgi/asgi
│   ├── users/  startups/  news/  events/  opportunities/
│   ├── messageries/  files/  logs/
│   └── import_api/           # Services de synchronisation API JEB + commande sync_all
├── scripts/                  # sync_all.sh (wrapper cron), script SQL
├── docker/                   # Dockerfile, entrypoint, settings Docker, guide Docker
├── G-SVR-500_project.pdf     # Cahier des charges
└── Procfile
```

## Tests

Le projet n'a pas de tests automatisés. Chaque application Django contient un `tests.py` généré par défaut, sans aucun test, et le frontend n'a pas de script de test. Vous pouvez lancer ESLint avec `npm run lint` dans `Frontend/`.
