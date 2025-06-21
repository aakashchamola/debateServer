from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Vote
from .serializers import VoteSerializer

# Create your views here.

# Adding VoteView for casting and retrieving votes
class VoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Vote cast successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        votes = Vote.objects.all()
        serializer = VoteSerializer(votes, many=True)
        return Response(serializer.data)
