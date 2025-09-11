from rest_framework import serializers
from .models import Message, Conversation
from django.db import models as django_models


class MessageSerializer(serializers.ModelSerializer):
    contenu = serializers.CharField(allow_blank=True, allow_null=True)

    class Meta:
        model = Message
        fields = ['id', 'expediteur', 'destinataire', 'sujet', 'contenu', 'lu_le', 'cree_le']
        read_only_fields = ['id', 'cree_le', 'lu_le']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['expediteur'] = request.user
        return super().create(validated_data)


class ConversationSerializer(serializers.ModelSerializer):
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'titre', 'participants', 'last_message', 'unread_count', 'is_active', 'cree_le', 'modifie_le']
        read_only_fields = ['id', 'cree_le', 'modifie_le']

    def get_unread_count(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user:
            return 0
        # unread messages in this conversation for the user
        return Message.objects.filter(django_models.Q(expediteur__in=obj.participants.all()) | django_models.Q(destinataire__in=obj.participants.all()),
                                      destinataire=user,
                                      lu_le__isnull=True).count()
