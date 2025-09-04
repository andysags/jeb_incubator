from rest_framework.routers import DefaultRouter
from .views import UtilisateurViewSet

router = DefaultRouter()
router.register(r'utilisateurs', UtilisateurViewSet)

urlpatterns = router.urls
