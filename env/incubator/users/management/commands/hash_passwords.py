from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import identify_hasher, make_password
from users.models import Utilisateur

class Command(BaseCommand):
    help = "Hash tous les mots de passe en clair restants dans la table users"

    def handle(self, *args, **options):
        total = 0
        hashed = 0
        skipped = 0
        for u in Utilisateur.objects.all():
            total += 1
            pw = u.password or ''
            needs_hash = True
            if '$' in pw:
                try:
                    identify_hasher(pw)
                    needs_hash = False
                except Exception:
                    needs_hash = True
            if not needs_hash:
                skipped += 1
                continue
            u.password = make_password(pw) if pw else pw
            u.save(update_fields=["password"])  # save déclenchera à nouveau, mais déjà hashé
            hashed += 1
        self.stdout.write(self.style.SUCCESS(f"Terminé: total={total} hashed={hashed} déjà_hashés={skipped}"))
