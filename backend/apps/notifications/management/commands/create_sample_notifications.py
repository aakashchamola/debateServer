from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.notifications.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample notifications for testing'

    def handle(self, *args, **options):
        # Get all users
        users = User.objects.all()
        
        if not users.exists():
            self.stdout.write(self.style.ERROR('No users found. Please create users first.'))
            return
        
        # Create sample notifications for each user
        for user in users:
            notifications = [
                {
                    'title': 'Welcome to DebateHub!',
                    'message': 'Thanks for joining our debate platform. Start by browsing available sessions.',
                    'notification_type': 'system',
                },
                {
                    'title': 'New Debate Session Available',
                    'message': 'A new debate session "Climate Change Solutions" has been created.',
                    'notification_type': 'debate_invite',
                },
                {
                    'title': 'Achievement Unlocked!',
                    'message': 'You\'ve earned the "First Participation" badge for joining your first debate.',
                    'notification_type': 'achievement',
                },
            ]
            
            for notification_data in notifications:
                notification, created = Notification.objects.get_or_create(
                    user=user,
                    title=notification_data['title'],
                    defaults=notification_data
                )
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f'Created notification "{notification.title}" for {user.username}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Notification "{notification.title}" already exists for {user.username}')
                    )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample notifications!')
        )
