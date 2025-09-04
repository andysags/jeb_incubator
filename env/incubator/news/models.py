from django.db import models
from django.utils import timezone

class Actualite(models.Model):
	titre = models.CharField(max_length=255)
	slug = models.SlugField(unique=True)
	contenu = models.TextField()
	image_url = models.CharField(max_length=255, blank=True, null=True)
	publie_le = models.DateTimeField(default=timezone.now)
	auteur = models.ForeignKey('users.Utilisateur', null=True, blank=True, on_delete=models.SET_NULL)
	type = models.CharField(max_length=50, null=True, blank=True, db_column='type')

	class Meta:
		# Table réelle supposée 'news'; on la traite en read-only
		db_table = 'news'
		managed = False

	def __str__(self):
		return self.titre
