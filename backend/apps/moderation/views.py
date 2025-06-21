from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ModerationAction
from .serializers import ModerationActionSerializer

# Create your views here.

# Adding ModerationActionView for recording actions
class ModerationActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ModerationActionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Action recorded successfully'}, status=201)
        return Response(serializer.errors, status=400)
