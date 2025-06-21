from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import RegisterView, LoginView, LogoutView, ProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]