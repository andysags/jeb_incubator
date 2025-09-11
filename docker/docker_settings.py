"""
Production Django settings for Docker deployment.
This file extends the base settings with Docker-specific configuration.
"""
import os
import dj_database_url
from pathlib import Path

# Import base settings
from env.incubator.incubator.settings import *

# Override settings for Docker/Production environment

# Security
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.environ.get('SECRET_KEY', SECRET_KEY)

# Allowed hosts
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Database - Use environment variable for connection
if 'DATABASE_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.parse(
            os.environ['DATABASE_URL'],
            conn_max_age=600,
            ssl_require=False  # Set to True if your DB requires SSL
        )
    }

# Static files configuration for Docker
STATIC_ROOT = '/app/staticfiles'
STATIC_URL = '/static/'

# Additional static files directories
STATICFILES_DIRS = [
    '/app/static',
]

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Add any production domains here
if not DEBUG:
    # Add your production domain
    # CORS_ALLOWED_ORIGINS.append("https://yourdomain.com")
    pass

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/app/logs/django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        '': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}

# Cache configuration (if Redis is available)
if 'REDIS_URL' in os.environ:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': os.environ['REDIS_URL'],
        }
    }

# Security settings for production
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
