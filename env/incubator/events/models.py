from django.db import models
from django.utils import timezone

class Evenement(models.Model):
	titre = models.CharField(max_length=255)
	description = models.TextField(blank=True, null=True)
	date_debut = models.DateTimeField(blank=True, null=True)
	date_fin = models.DateTimeField(blank=True, null=True)
	lieu = models.CharField(max_length=255, blank=True, null=True)
	organisateur = models.ForeignKey('users.Utilisateur', null=True, blank=True, on_delete=models.SET_NULL)
	nb_inscrits = models.IntegerField(db_column='nb_inscrits', default=0)
	type = models.CharField(max_length=50, default='general', db_column='type')
	photo_url = models.CharField(max_length=255, null=True, blank=True, db_column='photo_url')

	class Meta:
		db_table = 'events'
		managed = False

	def __str__(self):
		return self.titre
