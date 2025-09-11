from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models as dj_models
from .models import Message, Conversation
from .serializers import MessageSerializer, ConversationSerializer
from users.models import Utilisateur
import os


def _is_allowed_pair(user_a: Utilisateur, user_b: Utilisateur) -> bool:
    roles = {user_a.role, user_b.role}
    # Only allow messages between startup and investor
    return roles == {'startup', 'investor'}


class IsFounderInvestor(permissions.BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'role', None):
            return False
        return user.role in ('startup', 'investor')


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsFounderInvestor]

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.filter(dj_models.Q(expediteur=user) | dj_models.Q(destinataire=user))
        conv_id = self.request.query_params.get('conversation_id')
        other = self.request.query_params.get('other')
        if conv_id:
            try:
                conv = Conversation.objects.get(pk=conv_id)
                participants = conv.participants.all()
                qs = qs.filter(dj_models.Q(expediteur__in=participants) | dj_models.Q(destinataire__in=participants))
            except Conversation.DoesNotExist:
                qs = qs.none()
        elif other:
            qs = qs.filter(dj_models.Q(expediteur__pk=other) | dj_models.Q(destinataire__pk=other))

        return qs.order_by('-cree_le')

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        destinataire_id = data.get('destinataire')
        if not destinataire_id:
            return Response({'detail': 'destinataire required'}, status=status.HTTP_400_BAD_REQUEST)
        destinataire = get_object_or_404(Utilisateur, pk=destinataire_id)
        if not _is_allowed_pair(request.user, destinataire):
            return Response({'detail': 'messaging only allowed between startup and investor'}, status=status.HTTP_403_FORBIDDEN)
        data['expediteur'] = request.user.pk
        serializer = self.get_serializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    # Default requires authentication. We support two dev overrides:
    # - environment variable MESSAGERIES_ALLOW_ANONYMOUS
    # - request header X-ALLOW-ANONYMOUS: 1
    def get_permissions(self):
        allow_any = os.environ.get('MESSAGERIES_ALLOW_ANONYMOUS') or self.request.META.get('HTTP_X_ALLOW_ANONYMOUS')
        if allow_any:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        allow_any = os.environ.get('MESSAGERIES_ALLOW_ANONYMOUS') or self.request.META.get('HTTP_X_ALLOW_ANONYMOUS')
        if allow_any and getattr(user, 'is_anonymous', True):
            return Conversation.objects.none()
        return Conversation.objects.filter(participants=user)


class UnreadCountView(generics.GenericAPIView):
    def get_permissions(self):
        allow_any = os.environ.get('MESSAGERIES_ALLOW_ANONYMOUS') or self.request.META.get('HTTP_X_ALLOW_ANONYMOUS')
        if allow_any:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request, *args, **kwargs):
        user = request.user
        allow_any = os.environ.get('MESSAGERIES_ALLOW_ANONYMOUS') or request.META.get('HTTP_X_ALLOW_ANONYMOUS')
        if allow_any and getattr(user, 'is_anonymous', True):
            return Response({'unread_count': 0})
        total_unread = Message.objects.filter(destinataire=user, lu_le__isnull=True).count()
        return Response({'unread_count': total_unread})


class MarkReadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Accept either message_ids list or conversation_id
        msg_ids = request.data.get('message_ids')
        conv_id = request.data.get('conversation_id')
        user = request.user
        qs = Message.objects.none()
        if msg_ids:
            qs = Message.objects.filter(id__in=msg_ids, destinataire=user, lu_le__isnull=True)
        elif conv_id:
            conv = get_object_or_404(Conversation, pk=conv_id)
            qs = Message.objects.filter(destinataire=user, lu_le__isnull=True, id__in=[m.id for m in Message.objects.filter(dj_models.Q(expediteur__in=conv.participants.all()) | dj_models.Q(destinataire__in=conv.participants.all()))])
        else:
            return Response({'detail': 'message_ids or conversation_id required'}, status=status.HTTP_400_BAD_REQUEST)

        updated = qs.update(lu_le=dj_models.functions.Now())
        return Response({'marked': updated})
