from django.db import models
from django.utils import timezone
import json


class SafeJSONField(models.JSONField):
    """
    Subclass of Django's JSONField that tolerates when the DB driver
    returns already-decoded Python objects (lists/dicts) as well as
    JSON strings. The default JSONField.from_db_value expects a string
    to be passed to json.loads which raises TypeError when given a list.
    This field normalizes the value to a Python object.
    """

    def from_db_value(self, value, expression, connection):
        # If the DB already returned a Python list/dict, return it as-is
        if value is None:
            return None
        if isinstance(value, (list, dict)):
            return value
        # Otherwise delegate to base implementation which will call json.loads
        try:
            return super().from_db_value(value, expression, connection)
        except TypeError:
            # fallback: if value is bytes, decode then load
            if isinstance(value, (bytes, bytearray)):
                try:
                    s = value.decode('utf-8')
                    return json.loads(s)
                except Exception:
                    return value
            return value

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
    reseaux_sociaux = SafeJSONField(blank=True, null=True)
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
    # Champs supplémentaires (noms en base are the English snake_case keys used by the frontend)
    name = models.CharField(max_length=255, blank=True, null=True, db_column='name')
    legal_status = models.CharField(max_length=100, blank=True, null=True, db_column='legal_status')
    address = models.CharField(max_length=500, blank=True, null=True, db_column='address')
    email = models.EmailField(max_length=255, blank=True, null=True, db_column='email')
    phone = models.CharField(max_length=50, blank=True, null=True, db_column='phone')
    created_at = models.DateTimeField(blank=True, null=True, db_column='created_at')
    description = models.TextField(blank=True, null=True, db_column='description')
    website_url = models.CharField(max_length=1024, blank=True, null=True, db_column='website_url')
    social_media_url = models.CharField(max_length=1024, blank=True, null=True, db_column='social_media_url')
    project_status = models.CharField(max_length=100, blank=True, null=True, db_column='project_status')
    needs = SafeJSONField(blank=True, null=True, db_column='needs')
    sector = models.CharField(max_length=100, blank=True, null=True, db_column='sector')
    maturity = models.CharField(max_length=100, blank=True, null=True, db_column='maturity')
    # 'founders' is used as a related_name on Founder.startup; keep DB column name 'founders'
    # but avoid attribute name clash by using `founders_json` in the model.
    founders_json = SafeJSONField(blank=True, null=True, db_column='founders')
    # Count views for the public profile
    views = models.IntegerField(default=0, db_column='views')

    class Meta:
        # La table réelle en base était "Startup" (French); on l'a renommée en 'startups'
        db_table = 'startups'
        managed = True  # Empêche Django de tenter un rename

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
