from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework import viewsets, status
from .models import Notification
from .serializers import NotificationSerializer

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
        """Get the count of unread notifications"""
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            'unread_count': count
        }, status=status.HTTP_200_OK)
