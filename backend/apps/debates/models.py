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

    @property
    def has_started(self):
        from django.utils import timezone
        now = timezone.now()
        return now >= self.start_time

    @property
    def has_ended(self):
        from django.utils import timezone
        now = timezone.now()
        return now > self.end_time

    @property
    def status(self):
        """Return the current status of the session"""
        if self.has_ended:
            return 'ended'
        elif self.is_ongoing:
            return 'ongoing'
        else:
            return 'scheduled'


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


class OnlineParticipant(models.Model):
    """Model to track online participants in real-time"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='online_sessions'
    )
    session = models.ForeignKey(
        DebateSession,
        on_delete=models.CASCADE,
        related_name='online_participants'
    )
    channel_name = models.CharField(max_length=255, unique=True)
    connected_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'session']
        indexes = [
            models.Index(fields=['session', 'connected_at']),
            models.Index(fields=['last_seen']),
        ]

    def __str__(self):
        return f"{self.user.username} online in {self.session}"


class TypingIndicator(models.Model):
    """Model to track who is currently typing"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='typing_sessions'
    )
    session = models.ForeignKey(
        DebateSession,
        on_delete=models.CASCADE,
        related_name='typing_users'
    )
    is_typing = models.BooleanField(default=True)
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'session']
        indexes = [
            models.Index(fields=['session', 'is_typing']),
            models.Index(fields=['updated_at']),
        ]

    def __str__(self):
        status = "typing" if self.is_typing else "stopped typing"
        return f"{self.user.username} {status} in {self.session}"


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
