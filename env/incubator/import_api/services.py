import json
import logging
from typing import Any, Iterable

import requests
from django.conf import settings
from django.utils import timezone
from django.db import connection
from startups.models import Startup, Founder
import certifi
from .models import ImportAPI

HEADERS = {
    "X-Group-Authorization": settings.JEB_API_TOKEN
}

BASE = getattr(settings, "JEB_API_BASE", "")
logger = logging.getLogger(__name__)


def _upsert_import_trace(cible_type: str, remote_id: Any, local_id: Any, payload: dict):
    """Assure unicité logique (source, cible_type, remote_id) avant trace.

    - Supprime les doublons éventuels en conservant le plus récent.
    - Effectue ensuite update_or_create.
    """
    try:
        qs = ImportAPI.objects.filter(source='API JEB', cible_type=cible_type, remote_id=str(remote_id))
        if qs.count() > 1:
            keep = qs.order_by('-dernier_sync', '-id').first()
            qs.exclude(id=keep.id).delete()
        ImportAPI.objects.update_or_create(
            source='API JEB',
            cible_type=cible_type,
            remote_id=str(remote_id),
            defaults={
                'local_id': local_id,
                'dernier_sync': timezone.now(),
                'payload_brut': json.dumps(payload, ensure_ascii=False),
            }
        )
    except Exception:
        logger.exception("Trace import échouée (%s %s)", cible_type, remote_id)


def _normalize_response(payload: Any) -> Iterable[dict]:
    """Ramène la réponse JSON à une liste de dicts.

    Gère cas:
      - payload déjà list
      - payload dict avec clé 'results' ou 'data'
      - payload string JSON (simple list ou dict)
    """
    if payload is None:
        return []

    # Si payload est déjà une structure Python (list/dict), la traiter sans json.loads
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        # dict paginé / enveloppé
        if isinstance(payload.get("results"), list):
            return payload["results"]
        if isinstance(payload.get("data"), list):
            return payload["data"]
        # si le dict ressemble déjà à un objet startup unique -> le mettre dans liste
        # heuristique: présence d'un champ id et d'un champ name/nom
        if any(k in payload for k in ("id", "nom", "name")):
            return [payload]
        return []

    # si bytes -> décoder en str
    if isinstance(payload, (bytes, bytearray)):
        try:
            payload = payload.decode('utf-8')
        except Exception:
            logger.warning("Payload bytes non décodable, ignore")
            return []

    # si string -> tenter json.loads
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            logger.warning("Payload string non JSON, ignore")
            return []

    # Après tentative de décodage, si on obtient une liste ou dict, ré-appeler la fonction
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        if isinstance(payload.get("results"), list):
            return payload["results"]
        if isinstance(payload.get("data"), list):
            return payload["data"]
        if any(k in payload for k in ("id", "nom", "name")):
            return [payload]

    return []


def sync_startups():
    candidate_paths = [
        "/startups/",
        "/startups",  # sans slash final
        "/api/startups/",
        "/api/startups",
        "/api/v1/startups/",
        "/api/v1/startups",
        "/v1/startups/",
        "/v1/startups",
    ]

    response = None
    chosen_url = None
    for suffix in candidate_paths:
        url = f"{BASE}{suffix}"
        logger.info("Tentative sync startups via %s", url)
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30, verify=certifi.where())
        except requests.RequestException as e:
            logger.warning("Erreur tentative %s: %s", url, e)
            continue
        if resp.status_code == 404:
            continue
        # garder première réponse non 404
        response = resp
        chosen_url = url
        break

    if response is None:
        logger.error("Toutes les tentatives ont retourné 404 / erreur")
        return {"ok": False, "error": "all_404"}

    if response.status_code >= 400:
        logger.error("Réponse %s sur %s: %s", response.status_code, chosen_url, response.text[:300])
        return {"ok": False, "status": response.status_code}

    try:
        raw = response.json()
    except ValueError:
        logger.error("Réponse non JSON: %s", response.text[:200])
        return {"ok": False, "error": "invalid_json"}

    items = _normalize_response(raw)
    logger.info("%d éléments startups reçus (type brut=%s)", len(list(items)) if hasattr(items, '__len__') else -1, type(raw).__name__)
    # Re-normaliser car liste(items) plus haut consommerait un générateur potentiel
    items = list(_normalize_response(raw))
    created = 0
    updated = 0
    errors = 0
    # Pour réconciliation: ensemble des remote_ids rencontrés
    seen_ids = set()
    for item in items:
        try:
            if not isinstance(item, dict):
                logger.warning("Item ignoré type=%s valeur=%r", type(item).__name__, item)
                continue
            remote_id = item.get("id") or item.get("pk")
            if remote_id is None:
                logger.warning("Item sans id: %r", item)
                continue
            seen_ids.add(remote_id)
            # Si la réponse 'list' est partielle, tenter de récupérer la ressource détail
            detail_needed_keys = ("description", "created_at", "website_url", "social_media_url", "needs", "founders")
            missing = any(k not in item or item.get(k) in (None, "", []) for k in detail_needed_keys)
            if missing:
                detail_paths = [f"/startups/{remote_id}", f"/startups/{remote_id}/", f"/api/startups/{remote_id}", f"/api/v1/startups/{remote_id}"]
                for dp in detail_paths:
                    try:
                        detail_url = f"{BASE}{dp}"
                        logger.info("Fetching detail for startup %s via %s", remote_id, detail_url)
                        r = requests.get(detail_url, headers=HEADERS, timeout=20, verify=certifi.where())
                        if r.status_code == 200:
                            try:
                                detail_raw = r.json()
                            except ValueError:
                                logger.warning("Detail non JSON for %s from %s", remote_id, detail_url)
                                continue
                            detail_items = _normalize_response(detail_raw)
                            if isinstance(detail_items, list) and detail_items:
                                item = detail_items[0]
                            elif isinstance(detail_raw, dict):
                                item = detail_raw
                            break
                    except requests.RequestException as e:
                        logger.warning("Erreur fetch detail %s: %s", detail_url, e)
                        continue
            founders_data = item.get("founders") or item.get("fondateurs") or []
            needs_data = item.get("needs") or item.get("current_needs") or item.get("besoins") or None

            defaults = {
                "nom": item.get("name") or item.get("nom") or f"Startup-{remote_id}",
                "slug": item.get("slug") or f"startup-{remote_id}",
                "description_courte": item.get("short_description") or item.get("description_courte"),
                "description_longue": item.get("description") or item.get("description_longue"),
                "secteur": item.get("sector") or item.get("secteur"),
                "stade": item.get("maturity") or item.get("stade"),
                "date_creation": item.get("created_at") or item.get("date_creation"),
                "site_web": item.get("website_url") or item.get("site_web"),
                "reseaux_sociaux": item.get("social_media_url") or item.get("reseaux_sociaux"),
                "logo_url": item.get("logo") or item.get("logo_url"),
                "contact_email": item.get("email") or item.get("contact_email") or "inconnu@example.com",
                "contact_tel": item.get("phone") or item.get("contact_tel"),
                "localisation": item.get("address") or item.get("localisation"),
                "nb_pers": item.get("team_size") or item.get("nb_pers") or 0,
                "cree_le": timezone.now(),
                "maj_le": timezone.now(),
                "name": item.get("name") or item.get("nom") or f"Startup-{remote_id}",
                "legal_status": item.get("legal_status") or item.get("statut_juridique"),
                "address": item.get("address") or item.get("adresse"),
                "email": item.get("email") or item.get("contact_email") or None,
                "phone": item.get("phone") or item.get("contact_tel"),
                "created_at": item.get("created_at") or item.get("date_creation"),
                "description": item.get("description") or item.get("description_longue"),
                "website_url": item.get("website_url") or item.get("site_web"),
                "social_media_url": item.get("social_media_url") or item.get("reseaux_sociaux"),
                "project_status": item.get("project_status") or item.get("status") or None,
                "needs": needs_data,
                "sector": item.get("sector") or item.get("secteur"),
                "maturity": item.get("maturity") or item.get("stade"),
            }

            # Avoid Django JSONField.from_db_value TypeError by not forcing
            # a model instance load when the DB may return native Python types
            # for JSON columns. Use exists()/update() to perform upsert.
            local_id = None
            try:
                if Startup.objects.filter(id=remote_id).exists():
                    # update via queryset avoids materializing model fields
                    Startup.objects.filter(id=remote_id).update(**defaults)
                    updated += 1
                    local_id = remote_id
                else:
                    # create new instance (no DB read of existing JSON fields)
                    startup = Startup.objects.create(id=remote_id, **defaults)
                    created += 1
                    local_id = startup.id
            except Exception:
                # fallback to original update_or_create if something unexpected
                try:
                    startup, is_created = Startup.objects.update_or_create(id=remote_id, defaults=defaults)
                    if is_created:
                        created += 1
                    else:
                        updated += 1
                    local_id = startup.id
                except Exception:
                    raise

            if isinstance(founders_data, list):
                try:
                    # update JSON column without instantiating model
                    Startup.objects.filter(id=remote_id).update(founders_json=founders_data)
                except Exception:
                    logger.exception("Impossible de sauvegarder founders_json pour %s", remote_id)
                # replace founders rows using startup_id to avoid loading Startup instance
                Founder.objects.filter(startup_id=remote_id).delete()
                for f in founders_data:
                    if not isinstance(f, dict):
                        continue
                    Founder.objects.create(
                        startup_id=remote_id,
                        name=f.get("name") or f.get("nom") or "Fondateur",
                    )

            # tracer import (dans la boucle)
            _upsert_import_trace('startup', remote_id, local_id, item)
        except Exception:
            errors += 1
            logger.exception("Erreur traitement startup (remote id=%s)", item.get("id") or item.get("pk"))
            continue

    # Détection des startups locales dont l'id n'est pas revenu côté distant
    try:
        local_ids = set(Startup.objects.values_list('id', flat=True))
        missing_remote = sorted(local_ids - seen_ids)
        if missing_remote:
            logger.warning("Startups locales absentes de la source distante: %s", missing_remote)
    except Exception:
        logger.exception("Impossible de calculer la réconciliation des IDs startups")

    result = {"ok": True, "created": created, "updated": updated, "errors": errors, "total": len(items), "missing_remote": missing_remote if 'missing_remote' in locals() else []}
    logger.info("Sync startups terminé: %s", result)
    return result


def sync_users():
    candidate_paths = [
        "/users/", "/users", "/api/users/", "/api/users", "/api/v1/users/", "/api/v1/users", "/v1/users/", "/v1/users"
    ]
    response = None
    chosen_url = None
    for suffix in candidate_paths:
        url = f"{BASE}{suffix}"
        logger.info("Tentative sync users via %s", url)
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30, verify=certifi.where())
        except requests.RequestException as e:
            logger.warning("Erreur tentative %s: %s", url, e)
            continue
        if resp.status_code == 404:
            continue
        response = resp
        chosen_url = url
        break
    if response is None:
        return {"ok": False, "error": "all_404"}
    if response.status_code >= 400:
        return {"ok": False, "status": response.status_code, "url": chosen_url}
    try:
        raw = response.json()
    except ValueError:
        return {"ok": False, "error": "invalid_json"}
    items = list(_normalize_response(raw))
    from users.models import Utilisateur
    created = 0
    updated = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        rid = item.get("id") or item.get("pk")
        if rid is None:
            continue
        defaults = {
            "nom": item.get("name") or item.get("nom") or item.get("email") or f"User-{rid}",
            "email": item.get("email") or f"user{rid}@example.com",
            # le hashing se fait dans Utilisateur.save() si clair
            "password": item.get("password") or "!imported!",
            "role": item.get("role") or "startup",
            "avatar_url": item.get("avatar") or item.get("avatar_url"),
            "dernier_login": item.get("last_login") or item.get("dernier_login"),
        }
        obj, is_created = Utilisateur.objects.update_or_create(id=rid, defaults=defaults)
        if is_created:
            created += 1
        else:
            updated += 1
    _upsert_import_trace('user', rid, obj.id, item)
    result = {"ok": True, "created": created, "updated": updated}
    logger.info("Sync users terminé: %s", result)
    return result


def sync_investors():
    from startups.models import Investor
    candidate_paths = [
        "/investors/", "/investors", "/api/investors/", "/api/investors", "/api/v1/investors/", "/api/v1/investors", "/v1/investors/", "/v1/investors"
    ]
    response = None
    chosen_url = None
    for suffix in candidate_paths:
        url = f"{BASE}{suffix}"
        logger.info("Tentative sync investors via %s", url)
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30, verify=certifi.where())
        except requests.RequestException as e:
            logger.warning("Erreur tentative %s: %s", url, e)
            continue
        if resp.status_code == 404:
            continue
        response = resp
        chosen_url = url
        break
    if response is None:
        return {"ok": False, "error": "all_404"}
    if response.status_code >= 400:
        return {"ok": False, "status": response.status_code, "url": chosen_url}
    try:
        raw = response.json()
    except ValueError:
        return {"ok": False, "error": "invalid_json"}
    items = list(_normalize_response(raw))
    created = 0
    updated = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        rid = item.get("id") or item.get("pk")
        if rid is None:
            continue
        defaults = {
            "name": item.get("name") or item.get("nom") or f"Investor-{rid}",
            "legal_status": item.get("legal_status"),
            "address": item.get("address"),
            "email": item.get("email") or f"investor{rid}@example.com",
            "phone": item.get("phone"),
            "description": item.get("description"),
            "investor_type": item.get("type") or item.get("investor_type"),
            "investment_focus": item.get("focus") or item.get("investment_focus"),
        }
        obj, is_created = Investor.objects.update_or_create(id=rid, defaults=defaults)
        if is_created:
            created += 1
        else:
            updated += 1
    _upsert_import_trace('investor', rid, obj.id, item)
    result = {"ok": True, "created": created, "updated": updated}
    logger.info("Sync investors terminé: %s", result)
    return result


def sync_partners():
    from startups.models import Partner
    candidate_paths = [
        "/partners/", "/partners", "/api/partners/", "/api/partners", "/api/v1/partners/", "/api/v1/partners", "/v1/partners/", "/v1/partners"
    ]
    response = None
    chosen_url = None
    for suffix in candidate_paths:
        url = f"{BASE}{suffix}"
        logger.info("Tentative sync partners via %s", url)
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30, verify=certifi.where())
        except requests.RequestException as e:
            logger.warning("Erreur tentative %s: %s", url, e)
            continue
        if resp.status_code == 404:
            continue
        response = resp
        chosen_url = url
        break
    if response is None:
        return {"ok": False, "error": "all_404"}
    if response.status_code >= 400:
        return {"ok": False, "status": response.status_code, "url": chosen_url}
    try:
        raw = response.json()
    except ValueError:
        return {"ok": False, "error": "invalid_json"}
    items = list(_normalize_response(raw))
    created = 0
    updated = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        rid = item.get("id") or item.get("pk")
        if rid is None:
            continue
        defaults = {
            "name": item.get("name") or item.get("nom") or f"Partner-{rid}",
            "legal_status": item.get("legal_status"),
            "address": item.get("address"),
            "email": item.get("email") or f"partner{rid}@example.com",
            "phone": item.get("phone"),
            "description": item.get("description"),
            "partnership_type": item.get("partnership_type") or item.get("type"),
        }
        obj, is_created = Partner.objects.update_or_create(id=rid, defaults=defaults)
        if is_created:
            created += 1
        else:
            updated += 1
    _upsert_import_trace('partner', rid, obj.id, item)
    result = {"ok": True, "created": created, "updated": updated}
    logger.info("Sync partners terminé: %s", result)
    return result


def sync_news():
    from news.models import Actualite
    from users.models import Utilisateur
    candidate_paths = [
        "/news/", "/news", "/api/news/", "/api/news", "/api/v1/news/", "/api/v1/news", "/v1/news/", "/v1/news"
    ]
    response = None
    chosen_url = None
    for suffix in candidate_paths:
        url = f"{BASE}{suffix}"
        logger.info("Tentative sync news via %s", url)
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30, verify=certifi.where())
        except requests.RequestException as e:
            logger.warning("Erreur tentative %s: %s", url, e)
            continue
        if resp.status_code == 404:
            continue
        response = resp
        chosen_url = url
        break
    if response is None:
        return {"ok": False, "error": "all_404"}
    if response.status_code >= 400:
        return {"ok": False, "status": response.status_code, "url": chosen_url}
    try:
        raw = response.json()
    except ValueError:
        return {"ok": False, "error": "invalid_json"}
    items = list(_normalize_response(raw))
    created = 0
    updated = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        rid = item.get("id") or item.get("pk")
        if rid is None:
            continue
        auteur_id = item.get("author_id") or item.get("auteur_id") or item.get("auteur")
        auteur_obj = None
        if auteur_id:
            from users.models import Utilisateur
            try:
                auteur_obj = Utilisateur.objects.filter(id=auteur_id).first()
            except Exception:
                auteur_obj = None
        defaults = {
            "titre": item.get("title") or item.get("titre") or f"News-{rid}",
            "slug": item.get("slug") or f"news-{rid}",
            "contenu": item.get("content") or item.get("contenu") or '',
            "image_url": item.get("image") or item.get("image_url"),
            "auteur": auteur_obj,
            "type": item.get("type"),
        }
        obj, is_created = Actualite.objects.update_or_create(id=rid, defaults=defaults)
        if is_created:
            created += 1
        else:
            updated += 1
    _upsert_import_trace('news', rid, obj.id, item)
    result = {"ok": True, "created": created, "updated": updated}
    logger.info("Sync news terminé: %s", result)
    return result


def sync_events():
    from events.models import Evenement
    from users.models import Utilisateur
    candidate_paths = [
        "/events/", "/events", "/api/events/", "/api/events", "/api/v1/events/", "/api/v1/events", "/v1/events/", "/v1/events"
    ]
    response = None
    chosen_url = None
    for suffix in candidate_paths:
        url = f"{BASE}{suffix}"
        logger.info("Tentative sync events via %s", url)
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30, verify=certifi.where())
        except requests.RequestException as e:
            logger.warning("Erreur tentative %s: %s", url, e)
            continue
        if resp.status_code == 404:
            continue
        response = resp
        chosen_url = url
        break
    if response is None:
        return {"ok": False, "error": "all_404"}
    if response.status_code >= 400:
        return {"ok": False, "status": response.status_code, "url": chosen_url}
    try:
        raw = response.json()
    except ValueError:
        return {"ok": False, "error": "invalid_json"}
    items = list(_normalize_response(raw))
    created = 0
    updated = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        rid = item.get("id") or item.get("pk")
        if rid is None:
            continue
        org_id = item.get("organizer_id") or item.get("organisateur_id")
        org_obj = None
        if org_id:
            try:
                org_obj = Utilisateur.objects.filter(id=org_id).first()
            except Exception:
                org_obj = None
        defaults = {
            "titre": item.get("title") or item.get("titre") or f"Event-{rid}",
            "description": item.get("description"),
            "date_debut": item.get("start_date") or item.get("date_debut"),
            "date_fin": item.get("end_date") or item.get("date_fin"),
            "lieu": item.get("location") or item.get("lieu"),
            "organisateur": org_obj,
            "nb_inscrits": item.get("attendees") or item.get("nb_inscrits") or 0,
            "type": item.get("type") or item.get("event_type") or 'general',
            "photo_url": item.get("image") or item.get("photo_url"),
        }
        obj, is_created = Evenement.objects.update_or_create(id=rid, defaults=defaults)
        if is_created:
            created += 1
        else:
            updated += 1
        # Additionally try to persist event_type and target_audience columns directly
        # Some external sources expose `event_type` and `target_audience` but the
        # Django model may not declare these fields (managed=False). Perform a raw
        # SQL UPDATE which will succeed only if the columns exist in the DB table.
        try:
            src_event_type = item.get('event_type') or item.get('type') or item.get('type_event') or None
            src_target = item.get('target_audience') or item.get('target_audiance') or item.get('target') or None
            if src_event_type is not None or src_target is not None:
                with connection.cursor() as cur:
                    # use parameterized query to avoid SQL injection
                    cur.execute(
                        'UPDATE events SET '
                        + ('event_type = %s' if src_event_type is not None else 'NULL')
                        + (', ' if src_event_type is not None and src_target is not None else '')
                        + ('target_audience = %s' if src_target is not None else 'NULL')
                        + ' WHERE id = %s',
                        ([v for v in (src_event_type, src_target) if v is not None] + [rid])
                    )
        except Exception:
            # Column may not exist or other DB error — ignore to keep sync robust
            logger.info('event_type/target_audience columns not present or update failed for event %s', rid)
        # Also try to persist a capacity/max_attendees-like column if provided by source
        try:
            src_capacity = None
            for k in ('max_attendees', 'max_attendees_count', 'capacity', 'max_capacity', 'nb_max', 'places', 'places_prevues'):
                if k in item and item.get(k) is not None:
                    try:
                        src_capacity = int(item.get(k))
                        break
                    except Exception:
                        try:
                            src_capacity = int(float(item.get(k)))
                            break
                        except Exception:
                            continue
            if src_capacity is not None:
                # detect which capacity-like column exists in the real table
                try:
                    with connection.cursor() as cur:
                        candidates = ['max_attendees','capacity','max_capacity','nb_max','places','places_prevues','capacity_total']
                        found = None
                        for col in candidates:
                            try:
                                cur.execute("SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2 LIMIT 1", ('events', col))
                                if cur.rowcount:
                                    found = col
                                    break
                            except Exception:
                                continue
                        if found:
                            cur.execute(`UPDATE events SET ${found} = %s WHERE id = %s`, (src_capacity, rid))
                except Exception:
                    logger.info('capacity update failed for event %s', rid)
        except Exception:
            # silence any issue to keep overall sync resilient
            logger.info('capacity parsing failed for event %s', rid)
        except Exception:
            # Column may not exist or other DB error — ignore to keep sync robust
            logger.info('event_type/target_audience columns not present or update failed for event %s', rid)
    _upsert_import_trace('event', rid, obj.id, item)
    result = {"ok": True, "created": created, "updated": updated}
    logger.info("Sync events terminé: %s", result)
    return result


def sync_all():
    actions = [
        ("startups", sync_startups),
        ("users", sync_users),
        ("investors", sync_investors),
        ("partners", sync_partners),
        ("news", sync_news),
        ("events", sync_events),
    ]
    results = {}
    for label, fn in actions:
        try:
            results[label] = fn()
        except Exception as e:
            logger.exception("Erreur sync %s", label)
            results[label] = {"ok": False, "error": str(e)}
    return results
