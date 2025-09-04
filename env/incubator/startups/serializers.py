from rest_framework import serializers
from .models import Startup
from .models import Startup, Founder, Investor, Partner

class StartupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Startup
        fields = '__all__'

class FounderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Founder
        fields = '__all__'

class InvestorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investor
        fields = '__all__'

class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = '__all__'
