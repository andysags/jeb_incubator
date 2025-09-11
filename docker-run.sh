#!/bin/bash

# Convenience script to run Docker commands from project root
# Usage: ./docker-run.sh [docker-compose command]

# Change to docker directory
cd "$(dirname "$0")/docker" || {
    echo "Error: Could not find docker directory"
    exit 1
}

# If no arguments provided, show help
if [ $# -eq 0 ]; then
    echo "Docker Helper Script"
    echo "===================="
    echo "Usage: ./docker-run.sh [command]"
    echo ""
    echo "Common commands:"
    echo "  up              - Start all services"
    echo "  up --build      - Build and start all services"
    echo "  up -d           - Start in detached mode"
    echo "  down            - Stop all services"
    echo "  down -v         - Stop and remove volumes"
    echo "  logs            - Show logs for all services"
    echo "  logs web        - Show logs for web service"
    echo "  ps              - Show running containers"
    echo "  build           - Build images"
    echo "  build --no-cache - Build without cache"
    echo ""
    echo "Development commands:"
    echo "  exec web bash   - Open shell in web container"
    echo "  exec web python manage.py migrate - Run migrations"
    echo "  exec web python manage.py createsuperuser - Create admin user"
    echo ""
    echo "For more commands, run: ./docker-run.sh help"
    exit 0
fi

# Special case for help
if [ "$1" = "help" ]; then
    docker-compose help
    exit 0
fi

# Run docker-compose with all provided arguments
echo "Running: docker-compose $*"
echo "Working directory: $(pwd)"
echo ""

exec docker-compose "$@"
