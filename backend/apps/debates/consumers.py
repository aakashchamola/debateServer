import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import DebateSession, Message, Participant


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

        # Send connection confirmation
        await self.send_json({
            'type': 'connection_established',
            'message': f'Connected to debate session {self.session_id}',
            'session_id': self.session_id
        })

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        if hasattr(self, 'room_group_name'):
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
        else:
            await self.send_json({
                'type': 'error',
                'message': 'Unknown message type'
            })

    async def handle_chat_message(self, content):
        """Handle chat messages"""
        message_content = content.get('message', '').strip()
        
        if not message_content:
            await self.send_json({
                'type': 'error',
                'message': 'Message cannot be empty'
            })
            return

        # Save message to database
        message = await self.save_message(message_content)
        
        if message:
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_content,
                    'sender': self.user.username,
                    'sender_id': self.user.id,
                    'timestamp': message.timestamp.isoformat(),
                    'message_id': message.id
                }
            )

    async def handle_typing_indicator(self, content):
        """Handle typing indicators"""
        is_typing = content.get('is_typing', False)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user': self.user.username,
                'user_id': self.user.id,
                'is_typing': is_typing
            }
        )

    async def chat_message(self, event):
        """Send chat message to WebSocket"""
        await self.send_json({
            'type': 'chat_message',
            'message': event['message'],
            'sender': event['sender'],
            'sender_id': event['sender_id'],
            'timestamp': event['timestamp'],
            'message_id': event['message_id']
        })

    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket (except to sender)"""
        if event['user_id'] != self.user.id:
            await self.send_json({
                'type': 'typing_indicator',
                'user': event['user'],
                'is_typing': event['is_typing']
            })

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
    def save_message(self, content):
        """Save message to database"""
        try:
            session = DebateSession.objects.get(id=self.session_id, is_active=True)
            
            # Check if session is ongoing
            if not session.is_ongoing:
                return None
                
            message = Message.objects.create(
                session=session,
                sender=self.user,
                content=content
            )
            return message
        except DebateSession.DoesNotExist:
            return None