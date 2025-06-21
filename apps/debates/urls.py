from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DebateTopicViewSet, DebateSessionViewSet, ParticipantViewSet, MessageViewSet

router = DefaultRouter()
router.register('topics', DebateTopicViewSet)
router.register('sessions', DebateSessionViewSet)
router.register('participants', ParticipantViewSet)
router.register('messages', MessageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
