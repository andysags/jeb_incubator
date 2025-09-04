from rest_framework.routers import DefaultRouter
from .views import StartupViewSet, FounderViewSet, InvestorViewSet, PartnerViewSet

router = DefaultRouter()
router.register(r'startups', StartupViewSet)
router.register(r'founders', FounderViewSet)
router.register(r'investors', InvestorViewSet)
router.register(r'partners', PartnerViewSet)

urlpatterns = router.urls
