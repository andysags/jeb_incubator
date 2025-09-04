from django.core.management.base import BaseCommand
from import_api.services import JEBImportService

class Command(BaseCommand):
    help = 'Importer des données depuis l\'API JEB'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            help='Type de données à importer (users, startups, events, news)',
            choices=['users', 'startups', 'events', 'news'],
            required=True
        )

    def handle(self, *args, **options):
        service = JEBImportService()
        import_type = options['type']

        self.stdout.write(f"Début de l'importation des {import_type}...")

        try:
            if import_type == 'users':
                service.import_users()
            elif import_type == 'startups':
                service.import_startups()
            elif import_type == 'events':
                service.import_events()
            elif import_type == 'news':
                service.import_news()

            self.stdout.write(
                self.style.SUCCESS(f"Importation des {import_type} terminée avec succès !")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Erreur lors de l'importation : {e}")
            )
