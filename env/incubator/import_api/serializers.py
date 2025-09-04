from rest_framework import serializers
from .models import ImportAPI

class ImportAPISerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportAPI
        fields = '__all__'
