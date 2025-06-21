from django.shortcuts import render
from rest_framework import viewsets
from debates.models import Debate, Participant, DebateTopic, DebateSession, Message
from debates.serializers import DebateSerializer, ParticipantSerializer, DebateTopicSerializer, DebateSessionSerializer, MessageSerializer

# Create your views here.

class DebateViewSet(viewsets.ModelViewSet):
    queryset = Debate.objects.all()
    serializer_class = DebateSerializer

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer

class DebateTopicViewSet(viewsets.ModelViewSet):
    queryset = DebateTopic.objects.all()
    serializer_class = DebateTopicSerializer

class DebateSessionViewSet(viewsets.ModelViewSet):
    queryset = DebateSession.objects.all()
    serializer_class = DebateSessionSerializer

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
