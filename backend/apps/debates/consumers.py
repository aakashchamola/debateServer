import json
import asyncio
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone
from .models import DebateSession, Message, Participant, OnlineParticipant, TypingIndicator


class DebateConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for real-time debate messaging.
    Supports async operations for better performance.
    """

    async def connect(self):
        """Handle WebSocket connection"""
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f'debate_{self.session_id}'
        self.user = self.scope['user']

        # Check if user is authenticated
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return

        # Check if session exists and user is a participant
        if not await self.is_valid_participant():
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Add user to online participants
        await self.add_online_participant()

        # Send connection confirmation with online count
        online_count, total_participants = await self.get_participant_counts()
        
        await self.send_json({
            'type': 'connection_established',
            'message': f'Connected to debate session {self.session_id}',
            'session_id': self.session_id,
            'online_count': online_count,
            'total_participants': total_participants
        })

        # Broadcast updated online count to all participants
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'online_count_update',
                'online_count': online_count,
                'total_participants': total_participants,
                'user_joined': {
                    'id': self.user.id,
                    'username': self.user.username
                }
            }
        )

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Remove user from online participants
        await self.remove_online_participant()
        
        # Clear typing indicator
        await self.clear_typing_indicator()

        # Get updated counts and broadcast
        online_count, total_participants = await self.get_participant_counts()
        
        # Leave room group
        if hasattr(self, 'room_group_name'):
            # Broadcast updated online count before leaving
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'online_count_update',
                    'online_count': online_count,
                    'total_participants': total_participants,
                    'user_left': {
                        'id': self.user.id,
                        'username': self.user.username
                    }
                }
            )
            
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        """Handle incoming WebSocket messages"""
        message_type = content.get('type', 'chat_message')
        
        if message_type == 'chat_message':
            await self.handle_chat_message(content)
        elif message_type == 'typing':
            await self.handle_typing_indicator(content)
        elif message_type == 'ping':
            await self.handle_ping()
        else:
            await self.send_json({
                'type': 'error',
                'message': 'Unknown message type'
            })

    async def handle_ping(self):
        """Handle ping to keep connection alive and update last seen"""
        await self.update_last_seen()
        await self.send_json({
            'type': 'pong',
            'timestamp': timezone.now().isoformat()
        })

    async def handle_chat_message(self, content):
        """Handle chat messages"""
        print(f"Received message content: {content}")
        message_content = content.get('content', '').strip()
        
        if not message_content:
            print("Empty message content")
            await self.send_json({
                'type': 'error',
                'message': 'Message cannot be empty'
            })
            return

        print(f"Processing message: {message_content}")
        
        # Clear typing indicator when message is sent
        await self.clear_typing_indicator()
        
        # Save message to database
        message = await self.save_message(message_content)
        
        if message:
            print(f"Message saved successfully, broadcasting to group: {self.room_group_name}")
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': message.id,
                        'content': message_content,
                        'user': {
                            'id': self.user.id,
                            'username': self.user.username,
                            'role': self.user.role
                        },
                        'timestamp': message.timestamp.isoformat()
                    }
                }
            )
        else:
            print("Failed to save message")
            await self.send_json({
                'type': 'error',
                'message': 'Failed to save message'
            })

    async def handle_typing_indicator(self, content):
        """Handle typing indicators"""
        is_typing = content.get('is_typing', False)
        
        # Update typing status in database
        await self.update_typing_status(is_typing)
        
        # Broadcast to other participants
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user': self.user.username,
                'user_id': self.user.id,
                'is_typing': is_typing
            }
        )

        # If user started typing, set a timer to clear it after 3 seconds
        if is_typing:
            asyncio.create_task(self.clear_typing_after_delay())

    async def clear_typing_after_delay(self):
        """Clear typing indicator after 3 seconds of inactivity"""
        await asyncio.sleep(3)
        await self.clear_typing_indicator(broadcast=True)

    async def chat_message(self, event):
        """Send chat message to WebSocket"""
        await self.send_json({
            'type': 'chat_message',
            'message': event['message']
        })

    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket (except to sender)"""
        if event['user_id'] != self.user.id:
            await self.send_json({
                'type': 'typing_indicator',
                'user': event['user'],
                'is_typing': event['is_typing']
            })

    async def online_count_update(self, event):
        """Send online count update to WebSocket"""
        await self.send_json({
            'type': 'online_count_update',
            'online_count': event['online_count'],
            'total_participants': event['total_participants'],
            'user_joined': event.get('user_joined'),
            'user_left': event.get('user_left')
        })

    # Database operations
    @database_sync_to_async
    def is_valid_participant(self):
        """Check if user is a valid participant in the session"""
        try:
            session = DebateSession.objects.get(id=self.session_id, is_active=True)
            return Participant.objects.filter(
                user=self.user,
                session=session,
                is_active=True
            ).exists()
        except DebateSession.DoesNotExist:
            return False

    @database_sync_to_async
    def add_online_participant(self):
        """Add user to online participants"""
        try:
            session = DebateSession.objects.get(id=self.session_id)
            OnlineParticipant.objects.update_or_create(
                user=self.user,
                session=session,
                defaults={
                    'channel_name': self.channel_name,
                    'last_seen': timezone.now()
                }
            )
        except Exception as e:
            print(f"Error adding online participant: {e}")

    @database_sync_to_async
    def remove_online_participant(self):
        """Remove user from online participants"""
        try:
            OnlineParticipant.objects.filter(
                user=self.user,
                session_id=self.session_id
            ).delete()
        except Exception as e:
            print(f"Error removing online participant: {e}")

    @database_sync_to_async
    def update_last_seen(self):
        """Update last seen timestamp"""
        try:
            OnlineParticipant.objects.filter(
                user=self.user,
                session_id=self.session_id
            ).update(last_seen=timezone.now())
        except Exception as e:
            print(f"Error updating last seen: {e}")

    @database_sync_to_async
    def get_participant_counts(self):
        """Get online and total participant counts"""
        try:
            session = DebateSession.objects.get(id=self.session_id)
            online_count = OnlineParticipant.objects.filter(session=session).count()
            total_participants = Participant.objects.filter(session=session, is_active=True).count()
            return online_count, total_participants
        except Exception as e:
            print(f"Error getting participant counts: {e}")
            return 0, 0

    @database_sync_to_async
    def update_typing_status(self, is_typing):
        """Update typing status in database"""
        try:
            session = DebateSession.objects.get(id=self.session_id)
            if is_typing:
                TypingIndicator.objects.update_or_create(
                    user=self.user,
                    session=session,
                    defaults={'is_typing': True, 'updated_at': timezone.now()}
                )
            else:
                TypingIndicator.objects.filter(
                    user=self.user,
                    session=session
                ).delete()
        except Exception as e:
            print(f"Error updating typing status: {e}")

    @database_sync_to_async
    def clear_typing_indicator(self, broadcast=False):
        """Clear typing indicator"""
        try:
            TypingIndicator.objects.filter(
                user=self.user,
                session_id=self.session_id
            ).delete()
            
            if broadcast:
                # This will be called from async context, so we need to use channel layer
                return True
        except Exception as e:
            print(f"Error clearing typing indicator: {e}")
            return False

    @database_sync_to_async
    def save_message(self, content):
        """Save message to database"""
        try:
            session = DebateSession.objects.get(id=self.session_id, is_active=True)
            
            # Check if user is still an active participant
            participant = Participant.objects.get(
                user=self.user,
                session=session,
                is_active=True
            )
            
            # For testing, allow messages even if session is not ongoing
            # TODO: Re-enable this check for production
            # if not session.is_ongoing:
            #     return None
                
            message = Message.objects.create(
                session=session,
                sender=self.user,
                content=content
            )
            print(f"Message saved: {message.id} - {content[:50]}...")
            return message
        except (DebateSession.DoesNotExist, Participant.DoesNotExist):
            print(f"Session {self.session_id} not found or user not a participant")
            return None
        except Exception as e:
            print(f"Error saving message: {e}")
            return None