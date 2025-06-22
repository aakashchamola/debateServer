from django.urls import path, include

# Import the router configuration from the urls directory
from .urls import router

urlpatterns = [
    path('', include(router.urls)),
]