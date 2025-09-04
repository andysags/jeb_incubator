from rest_framework import viewsets
from .models import Evenement
from .serializers import EvenementSerializer

class EvenementViewSet(viewsets.ModelViewSet):
    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
from django.shortcuts import render

# Create your views here.
