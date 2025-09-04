# Guide d'installation & exploitation — Projet Incubator

## 1. Prérequis système

| Composant | Version conseillée | Notes |
|-----------|--------------------|-------|
| Python    | 3.13.x             | Virtualenv dédié obligatoire |
| PostgreSQL| 14+                | UTF-8, timezone UTC recommandée |
| OS        | Linux (Debian/Ubuntu/Fedora) | Testé sur Linux |

Paquets système utiles (Debian/Ubuntu) :
```bash
sudo apt-get update && sudo apt-get install -y build-essential python3.13 python3.13-venv libpq-dev postgresql postgresql-contrib curl
```

## 2. Cloner & environnement Python
```bash
git clone <repo-url> incubator && cd incubator
python3.13 -m venv env
source env/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 3. Configuration PostgreSQL

Connexion superuser :
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
```
Création base + rôle :
```sql
CREATE DATABASE jeb ENCODING 'UTF8';
CREATE USER merchex_user WITH PASSWORD 'ton_mot_de_passe';
GRANT CONNECT ON DATABASE jeb TO merchex_user;
\c jeb
GRANT USAGE ON SCHEMA public TO merchex_user;
```

### 3.1. Droits sur tables / séquences existantes (DB-first)
Lister séquences :
```sql
SELECT sequencename FROM pg_sequences WHERE schemaname='public';
```
Appliquer (exemple générique) :
```sql
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO merchex_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO merchex_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO merchex_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO merchex_user;
GRANT ALL ON SCHEMA public TO merchex_user;
ALTER USER merchex_user WITH SUPERUSER;
```

### 3.2. Vérification
```bash
psql -U merchex_user -d jeb -c "\dt" 
```

## 4. Paramètres Django
Fichier : `env/incubator/incubator/settings.py`
```python3
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'jeb',
        'USER': 'merchex_user',
        'PASSWORD': 'merchex_pass',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
JEB_API_TOKEN = "<votre_token>"
JEB_API_BASE = "https://api.jeb-incubator.com"
```

Variables optionnelles via `.env` (chargé par script sync) :
```env
JEB_API_TOKEN=xxxxx
DJANGO_SETTINGS_MODULE=incubator.settings
```

## 5. Migrations & modèle DB-first
Base déjà existante :
```bash
cd env/incubator
pip install djangorestframework
pip install django-cors-headers
pip install psycopg2-binary
python3 manage.py migrate --fake-initial
```
Nouvelle table gérée :
```bash
python3 manage.py makemigrations <app>
python3 manage.py migrate <app>
```
Table créée manuellement déjà présente :
```bash
python3 manage.py makemigrations <app>
python3 manage.py migrate <app> --fake
```

## 6. Lancement serveur dev
```bash
cd env/incubator
python3 manage.py runserver 0.0.0.0:8000
```

## 7. Synchronisation API externe
Fonctionnement : commandes `sync_*` centralisées dans `import_api.services` + commande `sync_all`.

Test manuel :
```bash
pip install django
pip install requests
python3 env/incubator/manage.py sync_all --pretty
sudo apt update && sudo apt install -y dbeaver-ce
```

Script wrapper (cron) : `scripts/sync_all.sh` (détection auto du manage.py, sérialisation payloads, log dans `logs/sync_all.log`).

## 8. Cron interne (django-crontab)
Entrée ajoutée dans `settings.py` :
```python3
CRONJOBS = [
    ('5 */2 * * *', 'django.core.management.call_command', ['sync_all']),
]
```
Activation :
```bash
python3 env/incubator/manage.py crontab add
python3 env/incubator/manage.py crontab show   # voir l'ID installé
```
Suppression :
```bash
python3 env/incubator/manage.py crontab remove
```

Alternative système (cron Unix) sans django-crontab :
```cron
5 */2 * * * /usr/bin/flock -n /tmp/sync_all.lock /chemin/projet/scripts/sync_all.sh >> /chemin/projet/logs/cron_sync_all.log 2>&1
```

## 9. Sécurité & mots de passe
Modèle `Utilisateur` : hash automatique (pbkdf2) lors du `save()`. Commande ponctuelle (si existait du clair) déjà fournie : `hash_passwords`.

## 10. Gestion du champ ImportAPI.payload_brut
Stocké en TEXT (JSON sérialisé) pour éviter double décodage. Accès lecture :
```sql
SELECT id, cible_type, remote_id, substr(payload_brut,1,120) FROM import_api LIMIT 10;
```

## 11. Timezone
Si warnings « naive datetime » : forcer UTC
```python3
from django.utils import timezone
timezone.make_aware(...)
```
Ou ajuster parsing dans `services.py` avant `update_or_create`.

## 12. Tests rapides API
```bash
curl http://127.0.0.1:8000/admin/          # interface admin
curl http://127.0.0.1:8000/api/startups/   # si route exposée
```

## 13. Dépannage
| Problème | Cause probable | Solution |
|----------|----------------|----------|
| Permission denied sequence | GRANT manquant | Voir section 3.1 |
| KeyError 'sync_all' | Commande non chargée | Vérifier app `import_api` dans INSTALLED_APPS |
| TypeError JSONField dict | Ancien schéma JSONField | Colonne passée en TEXT + json.dumps |
| Naive datetime warning | Données sans tz | Convertir via timezone.make_aware |
| Cron ne tourne pas | Crontab non installé | `manage.py crontab show` |

## 14. Index recommandés
```sql
CREATE INDEX IF NOT EXISTS import_api_ct_remote_idx ON import_api (cible_type, remote_id);
```

## 15. Production (pistes)
- Mettre DEBUG=False, configurer ALLOWED_HOSTS
- Ajouter reverse proxy (Nginx) + HTTPS
- Superviser cron (ou systemd timer) plutôt que django-crontab
- Sauvegardes PostgreSQL (pg_dump + rotation)

## 16. Commandes utiles récap
```bash
python3 env/incubator/manage.py sync_all --pretty
python3 env/incubator/manage.py crontab add
python3 env/incubator/manage.py crontab show
python3 env/incubator/manage.py shell
```

---
Pour script d’automatisation GRANT complet ou adaptation Docker, demander séparément.
