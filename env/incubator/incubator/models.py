from django.db import models
from django.utils import timezone

class ImportAPI(models.Model):
    source = models.CharField(max_length=255, default='API JEB')
    remote_id = models.CharField(max_length=255)
    local_id = models.IntegerField()
    cible_type = models.CharField(max_length=100)
    dernier_sync = models.DateTimeField(default=timezone.now)
    payload_brut = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = 'ImportAPI'

    def __str__(self):
        return f"Import {self.source} {self.remote_id} -> {self.local_id} ({self.cible_type})"
