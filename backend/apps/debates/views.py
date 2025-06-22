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
        """Allow participants and moderators to enter the chat room"""
        session = get_object_or_404(DebateSession, pk=pk, is_active=True)
        
        # Check if user is the session moderator (creator)
        if request.user == session.created_by:
            # Moderator can always enter their created sessions
            serializer = self.get_serializer(session)
            return Response({
                'session': serializer.data,
                'user_role': 'moderator',
                'is_session_creator': True,
                'message': 'Moderator chat access granted'
            }, status=status.HTTP_200_OK)
        
        # Check if user is a participant
        try:
            participant = Participant.objects.get(user=request.user, session=session, is_active=True)
            serializer = self.get_serializer(session)
            return Response({
                'session': serializer.data,
                'participant': ParticipantSerializer(participant).data,
                'user_role': 'participant',
                'is_session_creator': False,
                'message': 'Participant chat access granted'
            }, status=status.HTTP_200_OK)
        except Participant.DoesNotExist:
            return Response(
                {'error': 'You must be a participant or the session moderator to enter the chat'}, 
                status=status.HTTP_403_FORBIDDEN
            )

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get message history for a session (for participants and moderators)"""
        session = get_object_or_404(DebateSession, pk=pk, is_active=True)
        
        # Check if user is the session moderator (creator)
        if request.user == session.created_by:
            # Moderator can see all messages
            messages = Message.objects.filter(
                session=session,
                is_deleted=False
            ).order_by('timestamp')
            
            serializer = MessageSerializer(messages, many=True)
            return Response({
                'results': serializer.data,
                'count': len(serializer.data),
                'user_role': 'moderator'
            }, status=status.HTTP_200_OK)
        
        # Check if user is a participant
        try:
            participant = Participant.objects.get(user=request.user, session=session, is_active=True)
            # Get messages from when user joined
            messages = Message.objects.filter(
                session=session,
                timestamp__gte=participant.joined_at,
                is_deleted=False
            ).order_by('timestamp')
            
            serializer = MessageSerializer(messages, many=True)
            return Response({
                'results': serializer.data,
                'count': len(serializer.data),
                'user_role': 'participant'
            }, status=status.HTTP_200_OK)
        except Participant.DoesNotExist:
            return Response(
                {'error': 'You must be a participant or the session moderator to view messages'}, 
                status=status.HTTP_403_FORBIDDEN
            )

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
        """Filter messages by session and user participation or moderation"""
        queryset = super().get_queryset()
        session_id = self.request.query_params.get('session_id', None)
        
        if session_id is not None:
            try:
                session = DebateSession.objects.get(id=session_id, is_active=True)
                
                # Check if user is the session moderator (creator)
                if self.request.user == session.created_by:
                    # Moderator can see all messages
                    queryset = queryset.filter(session_id=session_id).order_by('timestamp')
                else:
                    # Check if user is a participant
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
                        # User is not a participant or moderator, return empty queryset
                        queryset = queryset.none()
            except DebateSession.DoesNotExist:
                queryset = queryset.none()
        
        return queryset

    def perform_create(self, serializer):
        """Allow participants and session moderators to send messages"""
        session_id = serializer.validated_data['session_id']
        session = get_object_or_404(DebateSession, id=session_id, is_active=True)
        
        # Check if user is the session moderator (creator)
        if self.request.user == session.created_by:
            # Moderator can always send messages in their created sessions
            message = serializer.save(sender=self.request.user, session=session)
        else:
            # Check if user is a participant
            if not Participant.objects.filter(
                user=self.request.user, 
                session=session, 
                is_active=True
            ).exists():
                raise ValidationError("You must be a participant or the session moderator to send messages")
            
            message = serializer.save(sender=self.request.user, session=session)
        
        # Check if session is ongoing
        if not session.is_ongoing:
            raise ValidationError("Cannot send messages to a session that is not currently ongoing")
        
        # Create notifications for other participants
        try:
            from apps.notifications.views import create_debate_message_notification
            create_debate_message_notification(message, exclude_user=self.request.user)
        except ImportError:
            # Notifications app not available, skip notification creation
            pass

    @action(detail=True, methods=['post'])
    def start_now(self, request, pk=None):
        """Allow moderators to start a scheduled session immediately"""
        session = get_object_or_404(DebateSession, pk=pk, is_active=True)
        
        # Check if user is the session moderator (creator)
        if request.user != session.created_by:
            return Response(
                {'error': 'Only the session creator can start the session immediately'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if session hasn't started yet
        if session.has_started:
            return Response(
                {'error': 'Session has already started or ended'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set start time to now and adjust end time accordingly
        from django.utils import timezone
        now = timezone.now()
        duration = session.end_time - session.start_time
        
        session.start_time = now
        session.end_time = now + duration
        session.save()
        
        serializer = self.get_serializer(session)
        return Response({
            'session': serializer.data,
            'message': 'Session started immediately'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """Allow moderators to reschedule a session"""
        session = get_object_or_404(DebateSession, pk=pk, is_active=True)
        
        # Check if user is the session moderator (creator)
        if request.user != session.created_by:
            return Response(
                {'error': 'Only the session creator can reschedule the session'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if session hasn't started yet
        if session.has_started:
            return Response(
                {'error': 'Cannot reschedule a session that has already started'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get new start time from request
        new_start_time = request.data.get('start_time')
        if not new_start_time:
            return Response(
                {'error': 'New start_time is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate duration and set new times
        duration = session.end_time - session.start_time
        session.start_time = new_start_time
        session.end_time = session.start_time + duration
        session.save()
        
        serializer = self.get_serializer(session)
        return Response({
            'session': serializer.data,
            'message': 'Session rescheduled successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def moderate_participant(self, request, pk=None):
        """Allow moderators to moderate participants (mute, warn, remove)"""
        session = get_object_or_404(DebateSession, pk=pk, is_active=True)
        
        # Check if user is the session moderator (creator)
        if request.user != session.created_by:
            return Response(
                {'error': 'Only the session creator can moderate participants'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        participant_id = request.data.get('participant_id')
        action = request.data.get('action')  # 'mute', 'warn', 'remove'
        
        if not participant_id or not action:
            return Response(
                {'error': 'participant_id and action are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            participant = Participant.objects.get(
                user_id=participant_id, 
                session=session, 
                is_active=True
            )
            
            # Create moderation action record
            try:
                from apps.moderation.models import ModerationAction
                ModerationAction.objects.create(
                    action=action.upper(),
                    participant=participant.user,
                    session=session
                )
            except ImportError:
                pass
            
            # Apply the action
            if action == 'remove':
                participant.is_active = False
                participant.save()
                message = f'Participant {participant.user.username} has been removed from the session'
            elif action == 'mute':
                # This would be handled by the frontend/websocket
                message = f'Participant {participant.user.username} has been muted'
            elif action == 'warn':
                message = f'Participant {participant.user.username} has been warned'
            else:
                return Response(
                    {'error': 'Invalid action. Use: mute, warn, or remove'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'message': message,
                'action': action,
                'participant': participant.user.username
            }, status=status.HTTP_200_OK)
            
        except Participant.DoesNotExist:
            return Response(
                {'error': 'Participant not found in this session'}, 
                status=status.HTTP_404_NOT_FOUND
            )