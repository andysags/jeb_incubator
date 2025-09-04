from django.db import models
from django.utils import timezone

class Fichier(models.Model):
	nom = models.CharField(max_length=255)
	url = models.CharField(max_length=1024)
	type = models.CharField(max_length=100, blank=True, null=True)
	taille = models.IntegerField(blank=True, null=True)
	proprietaire_type = models.CharField(max_length=50)
	proprietaire_id = models.IntegerField()
	cree_le = models.DateTimeField(default=timezone.now)

	class Meta:
		db_table = 'Fichier'

	def __str__(self):
		return self.nom
