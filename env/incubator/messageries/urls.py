from django.urls import path
from .views import MessageListCreateView, ConversationListView, UnreadCountView, MarkReadView

urlpatterns = [
	path('messages/', MessageListCreateView.as_view(), name='messages-list-create'),
	path('conversations/', ConversationListView.as_view(), name='conversations-list'),
	path('messages/unread_count/', UnreadCountView.as_view(), name='messages-unread-count'),
	path('messages/mark_read/', MarkReadView.as_view(), name='messages-mark-read'),
]
