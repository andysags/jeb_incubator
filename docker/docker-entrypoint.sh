#!/bin/bash

# Exit on any error
set -e

echo "Starting Django application..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
python -c "
import sys
import time
try:
    import psycopg
    from psycopg import OperationalError
except ImportError:
    # Fallback to psycopg2 if available
    import psycopg2 as psycopg
    from psycopg2 import OperationalError

max_attempts = 30
attempt = 0

while attempt < max_attempts:
    try:
        import os
        import dj_database_url
        
        # Parse DATABASE_URL if available
        if 'DATABASE_URL' in os.environ:
            db_config = dj_database_url.parse(os.environ['DATABASE_URL'])
            conn = psycopg.connect(
                host=db_config['HOST'],
                port=db_config['PORT'],
                user=db_config['USER'],
                password=db_config['PASSWORD'],
                dbname=db_config['NAME']
            )
            conn.close()
            print('Database is ready!')
            break
        else:
            print('No DATABASE_URL found, skipping database check')
            break
    except OperationalError:
        attempt += 1
        print(f'Database not ready, attempt {attempt}/{max_attempts}. Waiting...')
        time.sleep(2)
else:
    print('Could not connect to database after maximum attempts')
    sys.exit(1)
"

# Create logs directory
mkdir -p logs

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if it doesn't exist (optional)
echo "Creating superuser if needed..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
" || echo "Could not create superuser"

echo "Starting Django server..."

# Execute the main command
exec "$@"
