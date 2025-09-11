from rest_framework import serializers
from .models import Utilisateur


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = [
            'id', 'nom', 'email', 'role', 'avatar_url', 'startup', 'dernier_login',
            'cree_le', 'maj_le'
        ]


class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = '__all__'


class RegisterSerializer(serializers.Serializer):
    nom = serializers.CharField(max_length=100, allow_blank=True, required=False)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6)
    role = serializers.CharField(required=False)

    def validate_email(self, value):
        if Utilisateur.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email déjà utilisé')
        return value

    def validate_role(self, value):
        if not value:
            return 'startup'
        value_norm = value.strip().lower()
        # accepter quelques alias courants
        aliases = {
            'user': 'startup',
            'utilisateur': 'startup',
            'admin': 'admin',
            'startup': 'startup',
        }
        mapped = aliases.get(value_norm)
        if mapped is None:
            raise serializers.ValidationError('Rôle invalide')
        return mapped
