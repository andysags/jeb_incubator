from rest_framework import viewsets
from .models import Actualite
from .serializers import ActualiteSerializer

class ActualiteViewSet(viewsets.ModelViewSet):
    queryset = Actualite.objects.all()
    serializer_class = ActualiteSerializer
from django.shortcuts import render

# Create your views here.
