from rest_framework import viewsets
from authentication.permissions import IsAdminOrReadOnly
from .models import Actualite
from .serializers import ActualiteSerializer

class ActualiteViewSet(viewsets.ModelViewSet):
    queryset = Actualite.objects.all()
    serializer_class = ActualiteSerializer
    permission_classes = [IsAdminOrReadOnly]
from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.utils.text import slugify
import uuid
from django.db import IntegrityError, transaction


class RecentNewsAPIView(APIView):
    """Renvoie les actualités récentes pour le dashboard admin.
    Calcul du statut : 'published' si `publie_le` <= maintenant, sinon 'draft'.
    """
    permission_classes = []

    def get(self, request):
        # accept optional ?limit=N and ?page=P to paginate results
        limit_param = request.query_params.get('limit')
        page_param = request.query_params.get('page')
        qs_all = Actualite.objects.all().order_by('-publie_le')
        total = qs_all.count()
        try:
            limit = int(limit_param) if limit_param else None
        except Exception:
            limit = None
        try:
            page = max(1, int(page_param)) if page_param else 1
        except Exception:
            page = 1

        if limit:
            offset = (page - 1) * limit
            qs = qs_all[offset: offset + limit]
        else:
            qs = qs_all
        now = timezone.now()
        items = []
        from django.utils import timezone as dj_tz
        for a in qs:
            publie = a.publie_le
            if publie is not None:
                # normalize naive datetimes to the current timezone to allow comparison
                try:
                    if dj_tz.is_naive(publie):
                        publie = dj_tz.make_aware(publie, dj_tz.get_default_timezone())
                except Exception:
                    # fallback: leave as-is
                    pass
            status_str = 'published' if publie and publie <= now else 'draft'
            items.append({
                'id': a.id,
                'title': a.titre,
                'status': status_str,
                'created_at': a.publie_le.isoformat() if a.publie_le else None,
                'views': None,
            })
        return Response({'items': items, 'total': total, 'page': page, 'limit': limit or total})

class CreateNewsAPIView(APIView):
    """Creates a minimal news item from the admin dashboard.

Expected JSON: { title, content, image_base64 (opt), draft (bool) }

Implementation: does not include `author` or `type` (depending on the request).
To mark an article as draft, we will set `publish_it` in the future (this avoids affecting the schema of the existing table, which is `managed = False`).
    """
    permission_classes = []

    def post(self, request):
        data = request.data
        title = data.get('title') or data.get('titre')
        content = data.get('content') or data.get('contenu')
        image_base64 = data.get('image_base64') or data.get('image_url')
        draft = bool(data.get('draft'))

        if not title or not content:
            return Response({'detail': 'title and content are required'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        if draft:
            # place publication far in the future to mark as draft without DB schema change
            # avoid using datetime.replace(year=...) which can produce incorrect dates
            # (and may behave oddly across DST/timezone naive conversions). Use timedelta.
            from datetime import timedelta
            publie_le = now + timedelta(days=365 * 100)
        else:
            publie_le = now

        a = Actualite(titre=title, contenu=content, image_url=(image_base64 or None), publie_le=publie_le)
        # Do not set auteur or type per request

        # Generate a slug from the title and ensure uniqueness to satisfy DB unique constraint.
        base_slug = slugify(title) or uuid.uuid4().hex[:8]
        slug_candidate = base_slug
        suffix = 0

        # Try to find a non-conflicting slug before saving
        while Actualite.objects.filter(slug=slug_candidate).exists():
            suffix += 1
            slug_candidate = f"{base_slug}-{suffix}"

        a.slug = slug_candidate

        try:
            with transaction.atomic():
                a.save()
        except IntegrityError:
            # race condition fallback: append random suffix and retry once
            a.slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"
            try:
                with transaction.atomic():
                    a.save()
            except IntegrityError:
                return Response({'detail': 'Could not create news due to slug conflict'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'id': a.id, 'title': a.titre, 'status': 'draft' if draft else 'published'}, status=status.HTTP_201_CREATED)

    def get(self, request):
        """Retourne les données complètes d'une actualité pour l'édition/affichage.

        Query params: id
        """
        news_id = request.query_params.get('id')
        if not news_id:
            return Response({'detail': 'id query parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            a = Actualite.objects.get(id=news_id)
        except Actualite.DoesNotExist:
            return Response({'detail': 'not found'}, status=status.HTTP_404_NOT_FOUND)

        data = {
            'id': a.id,
            'title': a.titre,
            'content': a.contenu,
            'image_url': getattr(a, 'image_url', None) or None,
            'publie_le': a.publie_le.isoformat() if a.publie_le else None,
        }
        return Response(data)
