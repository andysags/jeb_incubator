from rest_framework import viewsets
from authentication.permissions import IsAdminOrReadOnly
from .models import Opportunite
from .serializers import OpportuniteSerializer

class OpportuniteViewSet(viewsets.ModelViewSet):
    queryset = Opportunite.objects.all()
    serializer_class = OpportuniteSerializer
    permission_classes = [IsAdminOrReadOnly]
from django.shortcuts import render

# Create your views here.
