from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import make_password, identify_hasher

# Utilisateur with role choices instead of separate Role table
ROLE_CHOICES = [
    ('admin', 'Admin'),
    ('startup', 'Startup'),
]


class Utilisateur(models.Model):
    nom = models.CharField(max_length=100)
    email = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='startup')
    startup = models.ForeignKey('startups.Startup', null=True, blank=True, on_delete=models.SET_NULL)
    avatar_url = models.CharField(max_length=1024, blank=True, null=True)
    dernier_login = models.DateTimeField(blank=True, null=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    maj_le = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'  # table existante
        managed = False     # ne pas tenter de créer / modifier

    def __str__(self):
        return self.nom or self.email

    def save(self, *args, **kwargs):
        pw = self.password or ''
        # si déjà haché (format algo$salt$hash) essayer identify_hasher
        needs_hash = True
        if '$' in pw:
            try:
                identify_hasher(pw)
                needs_hash = False
            except Exception:
                needs_hash = True
        if needs_hash and pw:
            self.password = make_password(pw)
        super().save(*args, **kwargs)
