#!/bin/bash
# Database Setup Script for Django
# Based on installation.md section 5

set -e  # Exit on any error
: "${POSTGRES_HOST:?POSTGRES_HOST not set}"
: "${POSTGRES_PORT:?POSTGRES_PORT not set}"
: "${POSTGRES_USER:?POSTGRES_USER not set}"
echo "Starting database setup..."

# Wait for PostgreSQL to be ready

echo "Waiting for PostgreSQL to be ready..."
while ! pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 1
done
echo "PostgreSQL is up - executing setup"

# Change to the Django application directory
cd ../env/incubator

# Run Django migrations (DB-first approach as mentioned in installation.md)
echo "Running Django migrations..."
python manage.py migrate --fake-initial

# Create superuser if it doesn't exist (optional - for admin access)
echo "Creating superuser if needed..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created')
else:
    print('Superuser already exists')
EOF

# Create recommended indexes (from installation.md section 14)
echo "Creating recommended database indexes..."
python manage.py dbshell << EOF
CREATE INDEX IF NOT EXISTS import_api_ct_remote_idx ON import_api (cible_type, remote_id);
EOF

# Set up cron jobs if django-crontab is configured
echo "Setting up cron jobs..."
python manage.py crontab add || echo "Crontab setup skipped (may not be configured)"

echo "Database setup completed successfully!"
