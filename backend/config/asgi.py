"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import sys
from pathlib import Path

# Add apps directory to Python path
sys.path.append(str(Path(__file__).resolve().parent.parent / 'apps'))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Import Django and configure before importing other modules
import django
django.setup()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import path
from debates.consumers import DebateConsumer
from debates.middleware import JWTAuthMiddlewareStack

# WebSocket-only ASGI application
application = ProtocolTypeRouter({
    "websocket": JWTAuthMiddlewareStack(
        URLRouter([
            path("ws/debate/<int:session_id>/", DebateConsumer.as_asgi()),
        ])
    ),
})
