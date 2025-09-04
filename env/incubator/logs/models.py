from django.db import models
from django.utils import timezone

class AuditLog(models.Model):
	utilisateur = models.ForeignKey('users.Utilisateur', null=True, blank=True, on_delete=models.SET_NULL)
	type_action = models.CharField(max_length=100)
	cible_type = models.CharField(max_length=100)
	cible_id = models.IntegerField()
	meta = models.JSONField(blank=True, null=True)
	cree_le = models.DateTimeField(default=timezone.now)

	class Meta:
		db_table = 'AuditLog'

	def __str__(self):
		return f"{self.type_action} on {self.cible_type}:{self.cible_id}"
