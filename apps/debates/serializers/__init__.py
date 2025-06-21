from rest_framework import serializers
from debates.models import Participant, DebateTopic, DebateSession, Message

class DebateTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebateTopic
        fields = '__all__'

class DebateSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebateSession
        fields = '__all__'

class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'