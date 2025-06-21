from rest_framework.permissions import BasePermission

class IsParticipant(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'STUDENT' or request.user.role == 'MODERATOR'
