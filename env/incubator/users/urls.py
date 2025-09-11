from django.urls import path
from .views import LoginView, MeView, RegisterView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
]

from rest_framework.routers import DefaultRouter
from .views import UtilisateurViewSet

router = DefaultRouter()
router.register(r'utilisateurs', UtilisateurViewSet)

urlpatterns += router.urls
