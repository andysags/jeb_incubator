from rest_framework import viewsets
from .models import Startup
from .serializers import StartupSerializer
from .models import Startup, Founder, Investor, Partner
from .serializers import StartupSerializer, FounderSerializer, InvestorSerializer, PartnerSerializer

class StartupViewSet(viewsets.ModelViewSet):
    queryset = Startup.objects.all()
    serializer_class = StartupSerializer

class FounderViewSet(viewsets.ModelViewSet):
    queryset = Founder.objects.all()
    serializer_class = FounderSerializer

class InvestorViewSet(viewsets.ModelViewSet):
    queryset = Investor.objects.all()
    serializer_class = InvestorSerializer

class PartnerViewSet(viewsets.ModelViewSet):
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer
