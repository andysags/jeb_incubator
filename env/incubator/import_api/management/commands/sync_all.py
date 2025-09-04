import json
from django.core.management.base import BaseCommand
from import_api import services

class Command(BaseCommand):
    help = "Lance la synchronisation de toutes les entités externes (startups, users, investors, partners, news, events)."

    def add_arguments(self, parser):
        parser.add_argument('--pretty', action='store_true', help='Affiche le JSON formaté')

    def handle(self, *args, **options):
        results = services.sync_all()
        if options.get('pretty'):
            self.stdout.write(json.dumps(results, indent=2, ensure_ascii=False))
        else:
            self.stdout.write(json.dumps(results, ensure_ascii=False))
        # Code de retour non-zero si au moins un échec
        if any(not (r.get('ok')) for r in results.values()):
            self.stderr.write(self.style.ERROR('Une ou plusieurs synchronisations ont échoué.'))
            raise SystemExit(1)
        self.stdout.write(self.style.SUCCESS('Synchronisation complète terminée.'))
