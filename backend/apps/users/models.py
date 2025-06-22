from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models


class User(AbstractUser):
    """Custom user model with role-based access control"""
    
    ROLE_CHOICES = [
        ('STUDENT', 'Student'),
        ('MODERATOR', 'Moderator'),
    ]
    
    # Make email required
    email = models.EmailField(unique=True, help_text="Email address (required)")
    
    role = models.CharField(
        max_length=10, 
        choices=ROLE_CHOICES, 
        default='STUDENT',
        help_text="User role in the debate platform"
    )
    
    # Notification preferences (always enabled for debate messages)
    notifications_enabled = models.BooleanField(
        default=True,
        help_text="Whether user receives notifications (always True for debate messages)"
    )
    
    # Fix related_name conflicts with Django's built-in User model
    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        help_text=(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name='custom_user_groups',
        related_query_name='custom_user',
    )

    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='custom_user_permissions',
        related_query_name='custom_user',
    )

    class Meta:
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_moderator(self):
        """Check if user is a moderator"""
        return self.role == 'MODERATOR'

    @property
    def is_student(self):
        """Check if user is a student"""
        return self.role == 'STUDENT'
