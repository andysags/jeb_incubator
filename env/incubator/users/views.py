from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from django.conf import settings
import jwt
from .models import Utilisateur
from .serializers import UtilisateurSerializer, LoginSerializer, MeSerializer, RegisterSerializer


class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    # Laisser la permission par défaut ou ajuster selon besoin


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response({'detail': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.password or not check_password(password, user.password):
            return Response({'detail': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)

        # Mettre à jour sans dépendre d'une PK (table legacy, managed=False)
        Utilisateur.objects.filter(email=user.email).update(dernier_login=timezone.now())

        exp_dt = timezone.now() + timezone.timedelta(hours=12)
        payload = {
            'sub': user.id,
            'email': user.email,
            'role': user.role,
            'exp': int(exp_dt.timestamp()),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        return Response({'token': token}, status=status.HTTP_200_OK)


class MeView(APIView):
    def get(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return Response({'detail': 'Non autorisé'}, status=status.HTTP_401_UNAUTHORIZED)

        token = auth_header.split(' ', 1)[1].strip()
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.PyJWTError:
            return Response({'detail': 'Jeton invalide'}, status=status.HTTP_401_UNAUTHORIZED)

        user_id = payload.get('sub')
        try:
            user = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response({'detail': 'Utilisateur introuvable'}, status=status.HTTP_404_NOT_FOUND)

        return Response(MeSerializer(user).data, status=status.HTTP_200_OK)


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user = Utilisateur(
            nom=data['nom'],
            email=data['email'],
            password=data['password'],  # sera hashé par save()
            role=data.get('role') or 'startup',
        )
        user.save()

        return Response({'id': user.id, 'email': user.email}, status=status.HTTP_201_CREATED)

from django.shortcuts import render

# Create your views here.
