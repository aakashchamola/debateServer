from rest_framework import serializers
from .models import ModerationAction

class ModerationActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModerationAction
        fields = '__all__'
