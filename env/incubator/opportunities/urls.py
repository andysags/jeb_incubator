from rest_framework.routers import DefaultRouter
from .views import OpportuniteViewSet

router = DefaultRouter()
router.register(r'opportunites', OpportuniteViewSet)

urlpatterns = router.urls
