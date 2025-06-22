from rest_framework.permissions import BasePermission


class IsModerator(BasePermission):
    """
    Custom permission to only allow moderators to access certain views.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role == 'MODERATOR'
        )


class IsModeratorOrReadOnly(BasePermission):
    """
    Custom permission to allow read-only access to any authenticated user,
    but only allow write permissions to moderators.
    """
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user and request.user.is_authenticated
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role == 'MODERATOR'
        )


class IsParticipantOfSession(BasePermission):
    """
    Custom permission to check if user is a participant of the debate session.
    """
    def has_object_permission(self, request, view, obj):
        from ..models import Participant
        
        # For Message objects, check if user is participant of the session
        if hasattr(obj, 'session'):
            return Participant.objects.filter(
                user=request.user,
                session=obj.session,
                is_active=True
            ).exists()
        
        # For Session objects, check if user is participant
        if hasattr(obj, 'participants'):
            return obj.participants.filter(
                user=request.user,
                is_active=True
            ).exists()
        
        return False