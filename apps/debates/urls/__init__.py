from rest_framework.routers import DefaultRouter
from debates.views import DebateViewSet, ParticipantViewSet, DebateTopicViewSet, DebateSessionViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'debates', DebateViewSet)
router.register(r'participants', ParticipantViewSet)
router.register(r'topics', DebateTopicViewSet)
router.register(r'sessions', DebateSessionViewSet)
router.register(r'messages', MessageViewSet)

urlpatterns = router.urls