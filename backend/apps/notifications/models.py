from django.db import models
from django.conf import settings

# Create your models here.

# Adding Notification model
class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('debate_invite', 'Debate Invitation'),
        ('debate_result', 'Debate Result'),
        ('achievement', 'Achievement'),
        ('system', 'System Notification'),
        ('moderation', 'Moderation Action'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200, default='Notification')
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='system')
    is_read = models.BooleanField(default=False)
    action_url = models.URLField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"{self.user.username} - {self.title}"
