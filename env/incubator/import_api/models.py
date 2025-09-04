from django.db import models
from django.utils import timezone
import json

class ImportAPI(models.Model):
    source = models.CharField(max_length=255, default='API JEB')
    remote_id = models.CharField(max_length=255)
    local_id = models.IntegerField()
    cible_type = models.CharField(max_length=100)
    dernier_sync = models.DateTimeField(default=timezone.now)
    # Stocké en texte brut JSON pour éviter double décodage sur certaines
    # bases / drivers qui peuvent déjà renvoyer dict -> on maîtrise la sérialisation.
    payload_brut = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'import_api'

    def __str__(self):
        return f"Import {self.source} {self.remote_id} -> {self.local_id} ({self.cible_type})"

    def set_payload(self, data):
        try:
            self.payload_brut = json.dumps(data, ensure_ascii=False)
        except Exception:
            self.payload_brut = None
