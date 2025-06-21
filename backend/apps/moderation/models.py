from django.db import models
from django.conf import settings

# Create your models here.

# Adding ModerationAction model
class ModerationAction(models.Model):
    ACTION_CHOICES = (
        ('MUTE', 'Mute'),
        ('REMOVE', 'Remove'),
        ('WARN', 'Warn'),
    )
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    participant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session = models.ForeignKey('debates.DebateSession', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
