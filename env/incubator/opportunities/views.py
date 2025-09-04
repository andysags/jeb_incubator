from rest_framework import viewsets
from .models import Opportunite
from .serializers import OpportuniteSerializer

class OpportuniteViewSet(viewsets.ModelViewSet):
    queryset = Opportunite.objects.all()
    serializer_class = OpportuniteSerializer
from django.shortcuts import render

# Create your views here.
