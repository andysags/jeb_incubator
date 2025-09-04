from rest_framework import serializers
from .models import Fichier

class FichierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fichier
        fields = '__all__'
