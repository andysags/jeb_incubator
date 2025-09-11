from rest_framework import viewsets
from authentication.permissions import IsAdminOrReadOnly
from .models import Evenement
from .serializers import EvenementSerializer

class EvenementViewSet(viewsets.ModelViewSet):
    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
    permission_classes = [IsAdminOrReadOnly]
from django.shortcuts import render

# Create your views here.
