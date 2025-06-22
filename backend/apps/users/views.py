from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status, viewsets, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404

from .serializers import (
    RegisterSerializer, 
    LoginSerializer, 
    UserProfileSerializer, 
    ChangePasswordSerializer,
    UserListSerializer,
    UserStatsSerializer,
    LeaderboardUserSerializer
)
from .models import UserStats

User = get_user_model()


class RegisterView(APIView):
    """API endpoint for user registration"""
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, responses={201: {'description': 'User registered successfully'}})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'User registered successfully',
                'user_id': user.id,
                'username': user.username
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """API endpoint for user login"""
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, responses={200: {'description': 'Login successful'}})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )
            if user and user.is_active:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'role': user.role,
                    }
                }, status=status.HTTP_200_OK)
            return Response({
                'error': 'Invalid credentials or inactive account'
            }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """API endpoint for user logout"""
    permission_classes = [IsAuthenticated]

    @extend_schema(request={'refresh': 'string'}, responses={200: {'description': 'Logged out successfully'}})
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({
                    'error': 'Refresh token is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)
        except TokenError:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'An error occurred during logout'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProfileView(APIView):
    """API endpoint for user profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user's profile"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """Update current user's profile (partial update)"""
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """API endpoint for changing password"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(request=ChangePasswordSerializer, responses={200: {'description': 'Password changed successfully'}})
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoints for user management"""
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'bio']
    ordering_fields = ['rating', 'date_joined', 'username']
    ordering = ['-rating']
    
    def get_serializer_class(self):
        if self.action == 'retrieve' and self.get_object() == self.request.user:
            # Use detailed serializer for user's own profile
            return UserProfileSerializer
        return UserListSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        """Follow a user"""
        user_to_follow = self.get_object()
        
        if user_to_follow == request.user:
            return Response(
                {'error': 'You cannot follow yourself'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request.user.follow(user_to_follow)
        serializer = UserListSerializer(user_to_follow, context={'request': request})
        
        return Response({
            'message': f'You are now following {user_to_follow.username}',
            'user': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def unfollow(self, request, pk=None):
        """Unfollow a user"""
        user_to_unfollow = self.get_object()
        
        request.user.unfollow(user_to_unfollow)
        serializer = UserListSerializer(user_to_unfollow, context={'request': request})
        
        return Response({
            'message': f'You are no longer following {user_to_unfollow.username}',
            'user': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        """Get list of user's followers"""
        user = self.get_object()
        followers = user.followers.filter(is_active=True)
        serializer = UserListSerializer(followers, many=True, context={'request': request})
        
        return Response({
            'count': followers.count(),
            'results': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        """Get list of users this user is following"""
        user = self.get_object()
        following = user.following.filter(is_active=True)
        serializer = UserListSerializer(following, many=True, context={'request': request})
        
        return Response({
            'count': following.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def my_following(self, request):
        """Get list of users the current user is following"""
        following = request.user.following.filter(is_active=True)
        serializer = UserListSerializer(following, many=True, context={'request': request})
        
        return Response({
            'count': following.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """Get leaderboard of top users by rating"""
        top_users = User.objects.filter(is_active=True).order_by('-rating')[:50]
        serializer = LeaderboardUserSerializer(top_users, many=True)
        
        return Response({
            'count': top_users.count(),
            'results': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get user statistics"""
        user = self.get_object()
        stats, created = UserStats.objects.get_or_create(user=user)
        serializer = UserStatsSerializer(stats)
        
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_username(request):
    username = request.query_params.get('username', None)
    if not username:
        return Response({'error': 'Username is required.'}, status=400)
    exists = User.objects.filter(username=username).exists()
    return Response({'available': not exists})
