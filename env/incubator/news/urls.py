from rest_framework.routers import DefaultRouter
from .views import ActualiteViewSet

router = DefaultRouter()
router.register(r'actualites', ActualiteViewSet)

urlpatterns = router.urls
