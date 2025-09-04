from django.db import models
from django.utils import timezone

class Opportunite(models.Model):
	titre = models.CharField(max_length=255)
	description = models.TextField(blank=True, null=True)
	type = models.CharField(max_length=100, blank=True, null=True)
	date_limite = models.DateTimeField(blank=True, null=True)
	lien = models.CharField(max_length=1024, blank=True, null=True)

	class Meta:
		db_table = 'Opportunites'

	def __str__(self):
		return self.titre
