from django.urls import path
from .views import ModerationActionView

urlpatterns = [
    path('action/', ModerationActionView.as_view(), name='moderation_action'),
]
