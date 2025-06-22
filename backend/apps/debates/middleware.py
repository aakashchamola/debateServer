from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
from urllib.parse import parse_qs

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_string):
    """Get user from JWT token"""
    try:
        # Validate token
        UntypedToken(token_string)
        
        # Decode token to get user_id
        decoded_data = jwt_decode(
            token_string, 
            settings.SECRET_KEY, 
            algorithms=["HS256"]
        )
        user_id = decoded_data.get('user_id')
        
        if user_id:
            user = User.objects.get(id=user_id)
            return user
        return AnonymousUser()
        
    except (InvalidToken, TokenError, User.DoesNotExist, Exception) as e:
        print(f"Token authentication error: {e}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """Custom middleware to authenticate WebSocket connections using JWT tokens"""
    
    async def __call__(self, scope, receive, send):
        # Parse query string for token
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        # Authenticate user
        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()
            
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """Convenience function to wrap the inner application with JWT auth middleware"""
    return JWTAuthMiddleware(inner)
