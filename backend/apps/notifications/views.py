from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework import viewsets, status
from .models import Notification
from .serializers import NotificationSerializer

# Utility function to create notifications
def create_debate_message_notification(message, exclude_user=None):
    """
    Create notifications for all participants in a debate when a new message is posted
    """
    from apps.debates.models import Participant
    
    session = message.session
    participants = Participant.objects.filter(
        session=session, 
        is_active=True
    ).exclude(user=exclude_user) if exclude_user else Participant.objects.filter(
        session=session, 
        is_active=True
    )
    
    # Create notifications for all other participants
    notifications_to_create = []
    for participant in participants:
        if participant.user.notifications_enabled:  # Check if user wants notifications
            notifications_to_create.append(
                Notification(
                    user=participant.user,
                    title=f"New message in {session.topic.title}",
                    message=f"{message.sender.username} posted: {message.content[:50]}{'...' if len(message.content) > 50 else ''}",
                    notification_type='debate_message',
                    action_url=f"/debate/{session.id}"
                )
            )
    
    # Bulk create notifications for efficiency
    if notifications_to_create:
        Notification.objects.bulk_create(notifications_to_create)
    
    return len(notifications_to_create)

# Create your views here.

# Adding NotificationViewSet for managing notifications
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user"""
        count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({
            'message': f'Marked {count} notifications as read',
            'count': count
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({
            'message': 'Notification marked as read'
        }, status=status.HTTP_200_OK)
        
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications for the current user"""
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            'unread_count': count
        }, status=status.HTTP_200_OK)
