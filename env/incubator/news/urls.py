from rest_framework.routers import DefaultRouter
from .views import ActualiteViewSet
from .views import RecentNewsAPIView, CreateNewsAPIView
from django.urls import path

router = DefaultRouter()
router.register(r'actualites', ActualiteViewSet)

urlpatterns = router.urls + [
	path('admin/recent-news', RecentNewsAPIView.as_view(), name='admin-recent-news'),
	path('admin/news', CreateNewsAPIView.as_view(), name='admin-create-news'),
]
