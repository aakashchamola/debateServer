from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer

# Create your views here.

# Adding NotificationView for managing notifications
class NotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = NotificationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({'message': 'Notification created successfully'}, status=201)
        return Response(serializer.errors, status=400)
