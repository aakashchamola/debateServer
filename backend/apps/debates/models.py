from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator


class DebateTopic(models.Model):
    """Model for debate topics that can be created by moderators"""
    title = models.CharField(
        max_length=255,
        validators=[MinLengthValidator(5)],
        help_text="Title of the debate topic"
    )
    description = models.TextField(
        validators=[MinLengthValidator(20)],
        help_text="Detailed description of the debate topic"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_topics'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.title


class DebateSession(models.Model):
    """Model for individual debate sessions"""
    topic = models.ForeignKey(
        DebateTopic,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    start_time = models.DateTimeField(help_text="When the debate session starts")
    end_time = models.DateTimeField(help_text="When the debate session ends")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_sessions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    max_participants = models.PositiveIntegerField(default=20)

    class Meta:
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['start_time']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.topic.title} - {self.start_time}"

    @property
    def is_ongoing(self):
        from django.utils import timezone
        now = timezone.now()
        return self.start_time <= now <= self.end_time


class Participant(models.Model):
    """Model for users participating in debate sessions"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='participations'
    )
    session = models.ForeignKey(
        DebateSession,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['user', 'session']
        indexes = [
            models.Index(fields=['joined_at']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.user.username} in {self.session}"


class Message(models.Model):
    """Model for messages in debate sessions"""
    session = models.ForeignKey(
        DebateSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    content = models.TextField(
        validators=[MinLengthValidator(1)],
        help_text="Message content"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['session', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}..."
