from rest_framework.routers import DefaultRouter
from ..views import DebateTopicViewSet, DebateSessionViewSet, ParticipantViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'topics', DebateTopicViewSet, basename='topic')
router.register(r'sessions', DebateSessionViewSet, basename='session')
router.register(r'participants', ParticipantViewSet, basename='participant')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = router.urls