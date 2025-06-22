from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

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
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'date_joined', 'notifications_enabled']
        read_only_fields = ['id', 'date_joined', 'role', 'notifications_enabled']


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
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'date_joined', 'is_active']
        read_only_fields = ['id', 'username', 'role', 'date_joined', 'is_active']