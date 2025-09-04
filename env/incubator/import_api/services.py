import json
import logging
from typing import Any, Iterable

import requests
from django.conf import settings
from django.utils import timezone
from startups.models import Startup, Founder
import certifi
from .models import ImportAPI

HEADERS = {
    "X-Group-Authorization": settings.JEB_API_TOKEN
}

BASE = getattr(settings, "JEB_API_BASE", "")
logger = logging.getLogger(__name__)


def _normalize_response(payload: Any) -> Iterable[dict]:
    """Ramène la réponse JSON à une liste de dicts.

    Gère cas:
      - payload déjà list
      - payload dict avec clé 'results' ou 'data'
      - payload string JSON (simple list ou dict)
    """
    if payload is None:
        return []
    # si string -> tenter json.loads
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            logger.warning("Payload string non JSON, ignore")
            return []
    # dict paginé / enveloppé
    if isinstance(payload, dict):
        if isinstance(payload.get("results"), list):
            return payload["results"]
        if isinstance(payload.get("data"), list):
            return payload["data"]
        # si le dict ressemble déjà à un objet startup unique -> le mettre dans liste
        # heuristique: présence d'un champ id et d'un champ name/nom
        if any(k in payload for k in ("id", "nom")):
            return [payload]
        return []
    if isinstance(payload, list):
        return payload
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
    for item in items:
        if not isinstance(item, dict):
            logger.warning("Item ignoré type=%s valeur=%r", type(item).__name__, item)
            continue
        remote_id = item.get("id") or item.get("pk")
        if remote_id is None:
            logger.warning("Item sans id: %r", item)
            continue

        # Mapping remote -> champs locaux (français)
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
        }
        startup, is_created = Startup.objects.update_or_create(
            id=remote_id,
            defaults=defaults
        )
        if is_created:
            created += 1
        else:
            updated += 1

        # Fondateurs (optionnels)
        founders_data = item.get("founders") or item.get("fondateurs") or []
        if isinstance(founders_data, list):
            startup.founders.all().delete()
            for f in founders_data:
                if not isinstance(f, dict):
                    continue
                Founder.objects.create(
                    startup=startup,
                    name=f.get("name") or f.get("nom") or "Fondateur",
                )

        # tracer import
    ImportAPI.objects.update_or_create(
            source='API JEB',
            remote_id=str(remote_id),
            cible_type='startup',
            defaults={
                'local_id': startup.id,
                'dernier_sync': timezone.now(),
        'payload_brut': json.dumps(item, ensure_ascii=False),
            }
        )

    result = {"ok": True, "created": created, "updated": updated}
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
    ImportAPI.objects.update_or_create(
            source='API JEB',
            remote_id=str(rid),
            cible_type='user',
            defaults={
                'local_id': obj.id,
                'dernier_sync': timezone.now(),
        'payload_brut': json.dumps(item, ensure_ascii=False),
            }
        )
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
    ImportAPI.objects.update_or_create(
            source='API JEB',
            remote_id=str(rid),
            cible_type='investor',
            defaults={
                'local_id': obj.id,
                'dernier_sync': timezone.now(),
        'payload_brut': json.dumps(item, ensure_ascii=False),
            }
        )
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
    ImportAPI.objects.update_or_create(
            source='API JEB',
            remote_id=str(rid),
            cible_type='partner',
            defaults={
                'local_id': obj.id,
                'dernier_sync': timezone.now(),
        'payload_brut': json.dumps(item, ensure_ascii=False),
            }
        )
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
    ImportAPI.objects.update_or_create(
            source='API JEB',
            remote_id=str(rid),
            cible_type='news',
            defaults={
                'local_id': obj.id,
                'dernier_sync': timezone.now(),
        'payload_brut': json.dumps(item, ensure_ascii=False),
            }
        )
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
            "type": item.get("type") or 'general',
            "photo_url": item.get("image") or item.get("photo_url"),
        }
        obj, is_created = Evenement.objects.update_or_create(id=rid, defaults=defaults)
        if is_created:
            created += 1
        else:
            updated += 1
    ImportAPI.objects.update_or_create(
            source='API JEB',
            remote_id=str(rid),
            cible_type='event',
            defaults={
                'local_id': obj.id,
                'dernier_sync': timezone.now(),
        'payload_brut': json.dumps(item, ensure_ascii=False),
            }
        )
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
