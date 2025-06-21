from django.db import models
from users.models import User
from django.conf import settings

# Create your models here.

class DebateTopic(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self):
        return self.title

class DebateSession(models.Model):
    topic = models.ForeignKey(DebateTopic, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

class Participant(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session = models.ForeignKey(DebateSession, on_delete=models.CASCADE)

class Message(models.Model):
    session = models.ForeignKey(DebateSession, on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
