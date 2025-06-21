import json
from channels.generic.websocket import JsonWebsocketConsumer
from asgiref.sync import async_to_sync
from .models import DebateSession, Message

class DebateConsumer(JsonWebsocketConsumer):
    def connect(self):
        session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f'debate_{session_id}'

        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive_json(self, content):
        session_id = self.scope['url_route']['kwargs']['session_id']
        message = Message.objects.create(
            session_id=session_id,
            sender=self.scope['user'],
            content=content['message']
        )

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message.content,
                'sender': message.sender.username
            }
        )

    def chat_message(self, event):
        self.send_json({
            'message': event['message'],
            'sender': event['sender']
        })