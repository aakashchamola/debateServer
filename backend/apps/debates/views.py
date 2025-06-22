from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import DebateTopic, DebateSession, Participant, Message
from .serializers import (
    DebateTopicSerializer, DebateSessionSerializer, 
    ParticipantSerializer, MessageSerializer
)
from .permissions import IsModerator


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
        """Allow students to join a debate session - only if it's currently live"""
        session = get_object_or_404(DebateSession, pk=pk, is_active=True)
        
        # Check if session is currently ongoing (live)
        if not session.is_ongoing:
            if session.start_time > timezone.now():
                return Response(
                    {'error': 'Cannot join a session that has not started yet. Wait for it to go live.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': 'Cannot join a session that has already ended.'}, 
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

    @action(detail=True, methods=['post'])
    def enter_chat(self, request, pk=None):
        """Allow participants to enter the chat room"""
        session = get_object_or_404(DebateSession, pk=pk, is_active=True)
        
        # Check if user is a participant
        try:
            participant = Participant.objects.get(user=request.user, session=session, is_active=True)
        except Participant.DoesNotExist:
            return Response(
                {'error': 'You must be a participant to enter the chat'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Return session details with chat access
        serializer = self.get_serializer(session)
        return Response({
            'session': serializer.data,
            'participant': ParticipantSerializer(participant).data,
            'message': 'Chat access granted'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get message history for a session (only for participants)"""
        session = get_object_or_404(DebateSession, pk=pk, is_active=True)
        
        # Check if user is a participant
        try:
            participant = Participant.objects.get(user=request.user, session=session, is_active=True)
        except Participant.DoesNotExist:
            return Response(
                {'error': 'You must be a participant to view messages'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get messages from when user joined
        messages = Message.objects.filter(
            session=session,
            timestamp__gte=participant.joined_at,
            is_deleted=False
        ).order_by('timestamp')
        
        serializer = MessageSerializer(messages, many=True)
        return Response({
            'results': serializer.data,
            'count': len(serializer.data)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def my_sessions(self, request):
        """Get sessions where the current user is a participant"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get sessions where user is an active participant
        participant_sessions = DebateSession.objects.filter(
            participants__user=request.user,
            participants__is_active=True,
            is_active=True
        ).distinct().order_by('-start_time')
        
        serializer = self.get_serializer(participant_sessions, many=True)
        return Response({
            'results': serializer.data,
            'count': len(serializer.data)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def my_stats(self, request):
        """Get current user's debate statistics"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user = request.user
        
        # Calculate stats
        total_participated = Participant.objects.filter(
            user=user, 
            is_active=True
        ).count()
        
        current_week_start = timezone.now() - timezone.timedelta(days=7)
        this_week_participated = Participant.objects.filter(
            user=user,
            is_active=True,
            joined_at__gte=current_week_start
        ).count()
        
        messages_sent = Message.objects.filter(
            sender=user,
            is_deleted=False
        ).count()
        
        stats = {
            'debates_participated': total_participated,
            'debates_won': 0,  # Future feature
            'current_rating': 1500,  # Future feature
            'debates_this_week': this_week_participated,
            'messages_sent': messages_sent,
            'total_sessions': total_participated,
        }
        
        return Response(stats, status=status.HTTP_200_OK)


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
        """Filter messages by session and user participation"""
        queryset = super().get_queryset()
        session_id = self.request.query_params.get('session_id', None)
        
        if session_id is not None:
            # Get user's participation in this session
            try:
                participant = Participant.objects.get(
                    user=self.request.user, 
                    session_id=session_id, 
                    is_active=True
                )
                # Only return messages from after the user joined
                queryset = queryset.filter(
                    session_id=session_id,
                    timestamp__gte=participant.joined_at
                ).order_by('timestamp')
            except Participant.DoesNotExist:
                # User is not a participant, return empty queryset
                queryset = queryset.none()
        
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
        
        message = serializer.save(sender=self.request.user, session=session)
        
        # Create notifications for other participants
        try:
            from apps.notifications.views import create_debate_message_notification
            create_debate_message_notification(message, exclude_user=self.request.user)
        except ImportError:
            # Notifications app not available, skip notification creation
            pass