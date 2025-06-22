from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from ..models import UserStats

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'role']
        extra_kwargs = {
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Password fields didn't match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile information"""
    followers_count = serializers.ReadOnlyField()
    following_count = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'date_joined', 
            'notifications_enabled', 'rating', 'bio', 
            'followers_count', 'following_count'
        ]
        read_only_fields = ['id', 'date_joined', 'role', 'notifications_enabled', 'rating']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password"""
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
        
    def validate_new_password(self, value):
        validate_password(value)
        return value


class UserListSerializer(serializers.ModelSerializer):
    """Basic user info for public listings"""
    followers_count = serializers.ReadOnlyField()
    following_count = serializers.ReadOnlyField()
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'role', 'date_joined', 'is_active', 
            'rating', 'bio', 'followers_count', 'following_count', 'is_following'
        ]
        read_only_fields = ['id', 'username', 'role', 'date_joined', 'is_active']
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user.is_following(obj)
        return False


class UserStatsSerializer(serializers.ModelSerializer):
    """Serializer for user statistics"""
    win_rate = serializers.ReadOnlyField()
    loss_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = UserStats
        fields = [
            'total_debates', 'debates_won', 'debates_lost', 'debates_drawn',
            'total_messages', 'avg_message_length', 'likes_received', 'likes_given',
            'highest_rating', 'lowest_rating', 'last_active', 'win_rate', 'loss_rate'
        ]


class LeaderboardUserSerializer(serializers.ModelSerializer):
    """Serializer for leaderboard users"""
    followers_count = serializers.ReadOnlyField()
    following_count = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'rating', 'followers_count', 'following_count'
        ]