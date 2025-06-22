from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone

from debates.models import DebateTopic, DebateSession, Participant, Message
from debates.serializers import (
    DebateTopicSerializer, DebateSessionSerializer, 
    ParticipantSerializer, MessageSerializer
)
from debates.permissions import IsModerator


class DebateTopicViewSet(viewsets.ModelViewSet):
    """ViewSet for managing debate topics"""
    queryset = DebateTopic.objects.filter(is_active=True)
    serializer_class = DebateTopicSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Only moderators can create, update, or delete topics"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsModerator]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]  # Allow anyone to read topics
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


class DebateSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing debate sessions"""
    queryset = DebateSession.objects.filter(is_active=True)
    serializer_class = DebateSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Only moderators can create, update, or delete sessions"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsModerator]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]  # Allow anyone to read sessions
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Allow students to join a debate session"""
        session = get_object_or_404(DebateSession, pk=pk, is_active=True)
        
        # Check if session is ongoing or future
        if session.end_time < timezone.now():
            return Response(
                {'error': 'Cannot join a session that has already ended'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is already a participant
        existing_participant = Participant.objects.filter(user=request.user, session=session).first()
        if existing_participant:
            if existing_participant.is_active:
                return Response(
                    {'error': 'You are already a participant in this session'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Reactivate the participant
                existing_participant.is_active = True
                existing_participant.save()
                serializer = ParticipantSerializer(existing_participant)
                return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Check participant limit
        if session.participants.filter(is_active=True).count() >= session.max_participants:
            return Response(
                {'error': 'Session has reached maximum participants'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participant = Participant.objects.create(user=request.user, session=session)
        serializer = ParticipantSerializer(participant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Allow users to leave a debate session"""
        session = get_object_or_404(DebateSession, pk=pk)
        
        try:
            participant = Participant.objects.get(user=request.user, session=session, is_active=True)
            participant.is_active = False
            participant.save()
            return Response({'message': 'Successfully left the session'}, status=status.HTTP_200_OK)
        except Participant.DoesNotExist:
            return Response(
                {'error': 'You are not a participant in this session'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class ParticipantViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing participants (read-only)"""
    queryset = Participant.objects.filter(is_active=True)
    serializer_class = ParticipantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter participants by session if provided"""
        queryset = super().get_queryset()
        session_id = self.request.query_params.get('session_id', None)
        if session_id is not None:
            queryset = queryset.filter(session_id=session_id)
        return queryset


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing debate messages"""
    queryset = Message.objects.filter(is_deleted=False)
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter messages by session"""
        queryset = super().get_queryset()
        session_id = self.request.query_params.get('session_id', None)
        if session_id is not None:
            queryset = queryset.filter(session_id=session_id)
        return queryset

    def perform_create(self, serializer):
        """Ensure user is a participant in the session before creating message"""
        session_id = serializer.validated_data['session_id']
        session = get_object_or_404(DebateSession, id=session_id, is_active=True)
        
        # Check if user is a participant
        if not Participant.objects.filter(
            user=self.request.user, 
            session=session, 
            is_active=True
        ).exists():
            raise ValidationError("You must be a participant to send messages in this session")
        
        # Check if session is ongoing
        if not session.is_ongoing:
            raise ValidationError("Cannot send messages to a session that is not currently ongoing")
        
        serializer.save(sender=self.request.user, session=session)