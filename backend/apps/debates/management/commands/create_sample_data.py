from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from debates.models import DebateTopic, DebateSession
from notifications.models import Notification
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample data for testing the admin panel'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating sample data...'))
        
        # Create users
        moderator, created = User.objects.get_or_create(
            username='moderator1',
            defaults={
                'email': 'moderator@example.com',
                'role': 'MODERATOR',
                'first_name': 'John',
                'last_name': 'Moderator'
            }
        )
        if created:
            moderator.set_password('admin123')
            moderator.save()
            self.stdout.write(f'Created moderator: {moderator.username}')
        
        student1, created = User.objects.get_or_create(
            username='student1',
            defaults={
                'email': 'student1@example.com',
                'role': 'STUDENT',
                'first_name': 'Alice',
                'last_name': 'Student'
            }
        )
        if created:
            student1.set_password('student123')
            student1.save()
            self.stdout.write(f'Created student: {student1.username}')
        
        student2, created = User.objects.get_or_create(
            username='student2',
            defaults={
                'email': 'student2@example.com',
                'role': 'STUDENT',
                'first_name': 'Bob',
                'last_name': 'Student'
            }
        )
        if created:
            student2.set_password('student123')
            student2.save()
            self.stdout.write(f'Created student: {student2.username}')
        
        # Create debate topics
        topics_data = [
            {
                'title': 'Climate Change and Environmental Policy',
                'description': 'Should governments implement stricter environmental regulations to combat climate change?'
            },
            {
                'title': 'Artificial Intelligence in Education',
                'description': 'Will AI replace traditional teaching methods in the next decade?'
            },
            {
                'title': 'Remote Work vs Office Work',
                'description': 'Is remote work more productive than traditional office work?'
            }
        ]
        
        topics = []
        for topic_data in topics_data:
            topic, created = DebateTopic.objects.get_or_create(
                title=topic_data['title'],
                defaults={
                    'description': topic_data['description'],
                    'created_by': moderator
                }
            )
            if created:
                topics.append(topic)
                self.stdout.write(f'Created topic: {topic.title}')
        
        # Create debate sessions
        now = timezone.now()
        sessions_data = [
            {
                'topic': topics[0] if topics else DebateTopic.objects.first(),
                'start_time': now + timedelta(hours=1),
                'end_time': now + timedelta(hours=2),
            },
            {
                'topic': topics[1] if len(topics) > 1 else DebateTopic.objects.first(),
                'start_time': now + timedelta(days=1),
                'end_time': now + timedelta(days=1, hours=1),
            },
            {
                'topic': topics[2] if len(topics) > 2 else DebateTopic.objects.first(),
                'start_time': now - timedelta(hours=1),
                'end_time': now + timedelta(hours=1),  # Ongoing session
            }
        ]
        
        for session_data in sessions_data:
            session, created = DebateSession.objects.get_or_create(
                topic=session_data['topic'],
                start_time=session_data['start_time'],
                defaults={
                    'end_time': session_data['end_time'],
                    'created_by': moderator
                }
            )
            if created:
                self.stdout.write(f'Created session: {session.topic.title} at {session.start_time}')
        
        # Create notifications
        notifications_data = [
            {
                'user': student1,
                'message': 'Welcome to the Online Debate Platform! Your account has been created successfully.'
            },
            {
                'user': student2,
                'message': 'New debate session "Climate Change and Environmental Policy" has been scheduled for tomorrow.'
            },
            {
                'user': student1,
                'message': 'You have been invited to participate in the AI in Education debate.'
            }
        ]
        
        for notif_data in notifications_data:
            notification, created = Notification.objects.get_or_create(
                user=notif_data['user'],
                message=notif_data['message']
            )
            if created:
                self.stdout.write(f'Created notification for: {notification.user.username}')
        
        self.stdout.write(
            self.style.SUCCESS('Sample data created successfully!')
        )
        self.stdout.write(
            self.style.WARNING('Login credentials:')
        )
        self.stdout.write(f'Superuser: kakuaakash / [your password]')
        self.stdout.write(f'Moderator: moderator1 / admin123')
        self.stdout.write(f'Student 1: student1 / student123')
        self.stdout.write(f'Student 2: student2 / student123')
