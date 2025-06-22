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
    
    # Community features
    rating = models.IntegerField(
        default=500,
        help_text="User's debate rating (starts at 500)"
    )
    
    bio = models.TextField(
        max_length=500,
        blank=True,
        help_text="User's biography"
    )
    
    # Following relationships (many-to-many through UserFollow model)
    following = models.ManyToManyField(
        'self',
        through='UserFollow',
        related_name='followers',
        symmetrical=False,
        blank=True
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
            models.Index(fields=['rating']),
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
        
    @property
    def followers_count(self):
        """Get the number of followers"""
        return self.followers.count()
        
    @property
    def following_count(self):
        """Get the number of users this user is following"""
        return self.following.count()
        
    def follow(self, user):
        """Follow another user"""
        if user != self:
            UserFollow.objects.get_or_create(follower=self, following=user)
            
    def unfollow(self, user):
        """Unfollow a user"""
        UserFollow.objects.filter(follower=self, following=user).delete()
        
    def is_following(self, user):
        """Check if this user is following another user"""
        return UserFollow.objects.filter(follower=self, following=user).exists()


class UserFollow(models.Model):
    """Model to track user following relationships"""
    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='following_relationships'
    )
    following = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='follower_relationships'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('follower', 'following')
        indexes = [
            models.Index(fields=['follower']),
            models.Index(fields=['following']),
            models.Index(fields=['created_at']),
        ]
        
    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"


class UserStats(models.Model):
    """Model to track user debate statistics"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='stats'
    )
    
    # Debate participation stats
    total_debates = models.IntegerField(default=0)
    debates_won = models.IntegerField(default=0)
    debates_lost = models.IntegerField(default=0)
    debates_drawn = models.IntegerField(default=0)
    
    # Message stats
    total_messages = models.IntegerField(default=0)
    avg_message_length = models.FloatField(default=0.0)
    
    # Engagement stats
    likes_received = models.IntegerField(default=0)
    likes_given = models.IntegerField(default=0)
    
    # Rating history (highest and lowest)
    highest_rating = models.IntegerField(default=500)
    lowest_rating = models.IntegerField(default=500)
    
    # Activity stats
    last_active = models.DateTimeField(auto_now=True)
    total_active_time = models.DurationField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['total_debates']),
            models.Index(fields=['debates_won']),
            models.Index(fields=['last_active']),
        ]
        
    def __str__(self):
        return f"Stats for {self.user.username}"
    
    @property
    def win_rate(self):
        """Calculate win rate percentage"""
        if self.total_debates == 0:
            return 0.0
        return (self.debates_won / self.total_debates) * 100
    
    @property
    def loss_rate(self):
        """Calculate loss rate percentage"""
        if self.total_debates == 0:
            return 0.0
        return (self.debates_lost / self.total_debates) * 100
