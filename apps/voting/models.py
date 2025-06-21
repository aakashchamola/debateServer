from django.db import models
from django.conf import settings

# Create your models here.

# Adding Vote model
class Vote(models.Model):
    session = models.ForeignKey('debates.DebateSession', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    choice = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
