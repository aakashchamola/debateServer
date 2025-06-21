from rest_framework import serializers
from django.contrib.auth import get_user_model
from debates.models import DebateTopic, DebateSession, Participant, Message

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for nested serialization"""
    class Meta:
        model = User
        fields = ['id', 'username', 'role']
        read_only_fields = ['id', 'username', 'role']


class DebateTopicSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = DebateTopic
        fields = ['id', 'title', 'description', 'created_by']
        read_only_fields = ['id', 'created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class DebateSessionSerializer(serializers.ModelSerializer):
    topic = DebateTopicSerializer(read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    topic_id = serializers.IntegerField(write_only=True)
    participant_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DebateSession
        fields = ['id', 'topic', 'topic_id', 'start_time', 'end_time', 'created_by', 'participant_count']
        read_only_fields = ['id', 'created_by', 'participant_count']

    def get_participant_count(self, obj):
        return obj.participant_set.count()

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ParticipantSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    session = DebateSessionSerializer(read_only=True)
    
    class Meta:
        model = Participant
        fields = ['id', 'user', 'session', 'joined_at']
        read_only_fields = ['id', 'user', 'session', 'joined_at']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserBasicSerializer(read_only=True)
    session_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'session_id', 'sender', 'content', 'timestamp']
        read_only_fields = ['id', 'sender', 'timestamp']

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)