from django.contrib import admin
from .models import ImportAPI

@admin.register(ImportAPI)
class ImportAPIAdmin(admin.ModelAdmin):
    list_display = ['source', 'remote_id', 'local_id', 'cible_type', 'dernier_sync']
    list_filter = ['source', 'cible_type', 'dernier_sync']
    search_fields = ['remote_id', 'local_id']
    readonly_fields = ['dernier_sync']
