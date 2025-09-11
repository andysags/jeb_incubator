from django.db import models
from django.utils import timezone
from .fields import EncryptedTextField

class Message(models.Model):
	expediteur = models.ForeignKey('users.Utilisateur', null=True, blank=True, on_delete=models.SET_NULL, related_name='messages_envoyes')
	destinataire = models.ForeignKey('users.Utilisateur', null=True, blank=True, on_delete=models.SET_NULL, related_name='messages_recus')
	sujet = models.CharField(max_length=255, blank=True, null=True)
	contenu = EncryptedTextField(blank=True, null=True)
	lu_le = models.DateTimeField(blank=True, null=True)
	cree_le = models.DateTimeField(default=timezone.now)

	class Meta:
		db_table = 'messages'
		managed = False

	def __str__(self):
		return self.sujet or f'Message {self.pk}'


class Conversation(models.Model):
	"""Simple conversation model linking participants and latest message."""
	titre = models.CharField(max_length=255, blank=True, null=True)
	participants = models.ManyToManyField('users.Utilisateur', related_name='conversations')
	last_message = models.ForeignKey(Message, null=True, blank=True, on_delete=models.SET_NULL, related_name='in_conversations')
	is_active = models.BooleanField(default=True)
	cree_le = models.DateTimeField(default=timezone.now)
	modifie_le = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'conversations'
		managed = True

	def __str__(self):
		return self.titre or f'Conversation {self.pk}'
