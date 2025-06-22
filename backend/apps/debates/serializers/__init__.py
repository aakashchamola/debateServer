from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import DebateTopic, DebateSession, Participant, Message

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
    participants_count = serializers.SerializerMethodField()
    title = serializers.CharField(source='topic.title', read_only=True)
    description = serializers.CharField(source='topic.description', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    is_ongoing = serializers.SerializerMethodField()
    has_started = serializers.SerializerMethodField()
    has_ended = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    user_has_joined = serializers.SerializerMethodField()
    
    class Meta:
        model = DebateSession
        fields = [
            'id', 'topic', 'topic_id', 'title', 'description', 'start_time', 'end_time', 
            'duration_minutes', 'max_participants', 'participants_count', 'created_by', 
            'is_ongoing', 'has_started', 'has_ended', 'status', 'user_has_joined'
        ]
        read_only_fields = [
            'id', 'created_by', 'participants_count', 'title', 'description', 
            'duration_minutes', 'is_ongoing', 'has_started', 'has_ended', 'status', 'user_has_joined'
        ]

    def get_participants_count(self, obj):
        return obj.participants.filter(is_active=True).count()
    
    def get_duration_minutes(self, obj):
        if obj.start_time and obj.end_time:
            duration = obj.end_time - obj.start_time
            return int(duration.total_seconds() / 60)
        return 0
    
    def get_is_ongoing(self, obj):
        return obj.is_ongoing
    
    def get_has_started(self, obj):
        return obj.has_started
    
    def get_has_ended(self, obj):
        return obj.has_ended
    
    def get_status(self, obj):
        return obj.status
    
    def get_user_has_joined(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.participants.filter(user=request.user, is_active=True).exists()
        return False

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
    user = UserBasicSerializer(source='sender', read_only=True)  # Alias for frontend compatibility
    created_at = serializers.DateTimeField(source='timestamp', read_only=True)  # Alias for frontend compatibility
    
    class Meta:
        model = Message
        fields = ['id', 'session_id', 'sender', 'user', 'content', 'timestamp', 'created_at']
        read_only_fields = ['id', 'sender', 'user', 'timestamp', 'created_at']

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)