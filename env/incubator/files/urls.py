from rest_framework.routers import DefaultRouter
from .views import FichierViewSet

router = DefaultRouter()
router.register(r'fichiers', FichierViewSet)

urlpatterns = router.urls
