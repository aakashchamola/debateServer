from django.db import models
from users.models import User

# Create your models here.

class DebateTopic(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class DebateSession(models.Model):
    topic = models.ForeignKey(DebateTopic, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Participant(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session = models.ForeignKey(DebateSession, on_delete=models.CASCADE)

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    session = models.ForeignKey(DebateSession, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
