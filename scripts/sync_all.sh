#!/usr/bin/env bash
# Script de lancement de la synchro complète pour usage via cron.
# Rendez-le exécutable : chmod +x scripts/sync_all.sh
# Option : placer un fichier .env à la racine contenant JEB_API_TOKEN=xxxxx

set -euo pipefail
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="$BASE_DIR/env"
PY="$VENV/bin/python"
# Détection manage.py : priorité au projet incubator dans env/incubator
if [ -f "$BASE_DIR/env/incubator/manage.py" ]; then
  MANAGE="$BASE_DIR/env/incubator/manage.py"
elif [ -f "$BASE_DIR/manage.py" ]; then
  MANAGE="$BASE_DIR/manage.py"
else
  echo "Impossible de localiser manage.py" >&2
  exit 2
fi
LOG_DIR="$BASE_DIR/logs"
mkdir -p "$LOG_DIR"

# Charger un .env si présent
if [ -f "$BASE_DIR/.env" ]; then
  set -a
  . "$BASE_DIR/.env"
  set +a
fi

# Choix dynamique du module settings selon projet détecté
if grep -q "incubator.settings" "$MANAGE" 2>/dev/null; then
  export DJANGO_SETTINGS_MODULE=incubator.settings
else
  export DJANGO_SETTINGS_MODULE=merchex.settings
fi
# (Optionnel) export JEB_API_TOKEN si pas dans settings.py et pas dans .env
# export JEB_API_TOKEN="CHANGER_CE_TOKEN"

STAMP="$(date '+%Y-%m-%dT%H:%M:%S')"
echo "[$STAMP] ==== Debut sync_all ==== " >> "$LOG_DIR/sync_all.log"
if ! "$PY" "$MANAGE" sync_all >> "$LOG_DIR/sync_all.log" 2>&1; then
  echo "[$STAMP] ERREUR sync_all" >> "$LOG_DIR/sync_all.log"
  exit 1
fi
STAMP_END="$(date '+%Y-%m-%dT%H:%M:%S')"
echo "[$STAMP_END] ==== Fin sync_all OK ==== " >> "$LOG_DIR/sync_all.log"
