from rest_framework import serializers
from .models import Actualite

class ActualiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actualite
        fields = '__all__'
