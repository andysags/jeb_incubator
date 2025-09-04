from rest_framework.routers import DefaultRouter
from .views import ImportAPIViewSet

router = DefaultRouter()
router.register(r'import-api', ImportAPIViewSet)

urlpatterns = router.urls
