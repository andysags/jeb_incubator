from rest_framework.routers import DefaultRouter
from .views import EvenementViewSet

router = DefaultRouter()
router.register(r'evenements', EvenementViewSet)

urlpatterns = router.urls
