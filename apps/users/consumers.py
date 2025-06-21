from channels.generic.websocket import JsonWebsocketConsumer
from asgiref.sync import async_to_sync

class AuthConsumer(JsonWebsocketConsumer):
    def connect(self):
        if self.scope['user'].is_authenticated:
            async_to_sync(self.channel_layer.group_add)(
                'authenticated_users',
                self.channel_name
            )
            self.accept()
        else:
            self.close()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            'authenticated_users',
            self.channel_name
        )

    def receive_json(self, content):
        self.send_json(content)
