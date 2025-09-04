from django.db import models
from django.utils import timezone

# Keep startups-specific models here. Other models moved to their apps.

class Startup(models.Model):
    nom = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description_courte = models.CharField(max_length=255, blank=True, null=True)
    description_longue = models.TextField(blank=True, null=True)
    secteur = models.CharField(max_length=100, blank=True, null=True)
    stade = models.CharField(max_length=50, choices=[
        ('idee', 'Idée'),
        ('seed', 'Seed'),
        ('croissance', 'Croissance')
    ], blank=True, null=True)
    date_creation = models.DateField(blank=True, null=True)
    site_web = models.CharField(max_length=1024, blank=True, null=True)
    reseaux_sociaux = models.JSONField(blank=True, null=True)
    logo_url = models.CharField(max_length=1024, blank=True, null=True)
    contact_email = models.CharField(max_length=255)
    contact_tel = models.CharField(max_length=50, blank=True, null=True)
    localisation = models.CharField(max_length=255, blank=True, null=True)
    date_incub = models.DateField(blank=True, null=True)
    nb_pers = models.IntegerField(default=0)
    chiffre_aff = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    cree_par = models.ForeignKey('users.Utilisateur', null=True, blank=True, on_delete=models.SET_NULL, related_name='startups_cree', db_column='cree_par')
    cree_le = models.DateTimeField(auto_now_add=True)
    maj_le = models.DateTimeField(auto_now=True)

    class Meta:
        # La table réelle en base est "startups" (minuscule pluriel). On aligne.
        db_table = 'startups'
        managed = False  # Empêche Django de tenter un rename (migration initiale divergente)

    def __str__(self):
        return self.nom

class Founder(models.Model):
    name = models.CharField(max_length=255)
    startup = models.ForeignKey(Startup, on_delete=models.CASCADE, related_name='founders')
    
    class Meta:
        db_table = 'founders'
    
    def __str__(self):
        return f"{self.name} - {self.startup.nom}"

class Investor(models.Model):
    name = models.CharField(max_length=255)
    legal_status = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=500, blank=True, null=True)
    email = models.EmailField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    description = models.TextField(blank=True, null=True)
    investor_type = models.CharField(max_length=100, blank=True, null=True)
    investment_focus = models.CharField(max_length=200, blank=True, null=True)
    
    class Meta:
        db_table = 'investors'
    
    def __str__(self):
        return self.name

class Partner(models.Model):
    name = models.CharField(max_length=255)
    legal_status = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=500, blank=True, null=True)
    email = models.EmailField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    description = models.TextField(blank=True, null=True)
    partnership_type = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        db_table = 'partners'
    
    def __str__(self):
        return self.name
