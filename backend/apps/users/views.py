from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate, get_user_model
from drf_spectacular.utils import extend_schema

from .serializers import (
    RegisterSerializer, 
    LoginSerializer, 
    UserProfileSerializer, 
    ChangePasswordSerializer,
    UserListSerializer
)

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
    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve' and self.get_object() == self.request.user:
            # Use detailed serializer for user's own profile
            return UserProfileSerializer
        return UserListSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def check_username(request):
    username = request.query_params.get('username', None)
    if not username:
        return Response({'error': 'Username is required.'}, status=400)
    exists = User.objects.filter(username=username).exists()
    return Response({'available': not exists})
