from django.db import models
from django.utils import timezone

class Message(models.Model):
	expediteur = models.ForeignKey('users.Utilisateur', null=True, blank=True, on_delete=models.SET_NULL, related_name='messages_envoyes')
	destinataire = models.ForeignKey('users.Utilisateur', null=True, blank=True, on_delete=models.SET_NULL, related_name='messages_recus')
	sujet = models.CharField(max_length=255, blank=True, null=True)
	contenu = models.TextField(blank=True, null=True)
	lu_le = models.DateTimeField(blank=True, null=True)
	cree_le = models.DateTimeField(default=timezone.now)

	class Meta:
		db_table = 'Message'

	def __str__(self):
		return self.sujet or f'Message {self.pk}'
