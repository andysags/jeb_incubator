from rest_framework import viewsets
from .models import ImportAPI
from .serializers import ImportAPISerializer

class ImportAPIViewSet(viewsets.ModelViewSet):
    queryset = ImportAPI.objects.all()
    serializer_class = ImportAPISerializer
