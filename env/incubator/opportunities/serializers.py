from rest_framework import serializers
from .models import Opportunite

class OpportuniteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Opportunite
        fields = '__all__'
