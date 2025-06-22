from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from debates.models import DebateTopic, DebateSession, Participant
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample data for the debate platform'

    def handle(self, *args, **options):
        self.stdout.write("Creating sample data...")
        
        # Create moderator
        self.stdout.write("Creating users...")
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
            moderator.set_password('password123')
            moderator.save()
            self.stdout.write(f"Created moderator: {moderator.username}")
        
        # Create students
        students = []
        student_data = [
            ('student1', 'alice@example.com', 'Alice', 'Johnson'),
            ('student2', 'bob@example.com', 'Bob', 'Smith'),
            ('student3', 'charlie@example.com', 'Charlie', 'Brown'),
            ('student4', 'diana@example.com', 'Diana', 'Wilson'),
            ('student5', 'eve@example.com', 'Eve', 'Davis'),
        ]
        
        for username, email, first_name, last_name in student_data:
            student, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'role': 'STUDENT',
                    'first_name': first_name,
                    'last_name': last_name
                }
            )
            if created:
                student.set_password('password123')
                student.save()
                self.stdout.write(f"Created student: {student.username}")
            students.append(student)
        
        # Create debate topics
        self.stdout.write("Creating debate topics...")
        topics_data = [
            {
                'title': 'Should Artificial Intelligence be Regulated?',
                'description': 'Discuss the necessity and implications of AI regulation in modern society.'
            },
            {
                'title': 'Is Climate Change the Most Pressing Global Issue?',
                'description': 'Debate whether climate change should be our top priority among global challenges.'
            },
            {
                'title': 'Should Social Media Platforms be Held Responsible for Misinformation?',
                'description': 'Examine the role and responsibility of social media companies in combating false information.'
            },
            {
                'title': 'Is Universal Basic Income a Viable Economic Solution?',
                'description': 'Analyze the feasibility and potential impact of implementing universal basic income.'
            },
            {
                'title': 'Should Space Exploration be a Priority Over Solving Earth Problems?',
                'description': 'Debate the allocation of resources between space exploration and terrestrial issues.'
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
                self.stdout.write(f"Created topic: {topic.title}")
            topics.append(topic)
        
        # Create debate sessions
        self.stdout.write("Creating debate sessions...")
        now = timezone.now()
        
        # Session 1: Currently ongoing (live)
        session1, created = DebateSession.objects.get_or_create(
            topic=topics[0],
            start_time=now - timedelta(minutes=15),
            defaults={
                'end_time': now + timedelta(hours=1),
                'created_by': moderator,
                'max_participants': 10
            }
        )
        if created:
            self.stdout.write(f"Created ongoing session: {session1.topic.title}")
        
        # Session 2: Scheduled for future
        session2, created = DebateSession.objects.get_or_create(
            topic=topics[1],
            start_time=now + timedelta(hours=2),
            defaults={
                'end_time': now + timedelta(hours=3),
                'created_by': moderator,
                'max_participants': 8
            }
        )
        if created:
            self.stdout.write(f"Created scheduled session: {session2.topic.title}")
        
        # Session 3: Scheduled for tomorrow
        session3, created = DebateSession.objects.get_or_create(
            topic=topics[2],
            start_time=now + timedelta(days=1),
            defaults={
                'end_time': now + timedelta(days=1, hours=1),
                'created_by': moderator,
                'max_participants': 12
            }
        )
        if created:
            self.stdout.write(f"Created tomorrow's session: {session3.topic.title}")
        
        # Session 4: Another live session
        session4, created = DebateSession.objects.get_or_create(
            topic=topics[3],
            start_time=now - timedelta(minutes=30),
            defaults={
                'end_time': now + timedelta(minutes=30),
                'created_by': moderator,
                'max_participants': 6
            }
        )
        if created:
            self.stdout.write(f"Created another ongoing session: {session4.topic.title}")
        
        # Session 5: Scheduled for next week
        session5, created = DebateSession.objects.get_or_create(
            topic=topics[4],
            start_time=now + timedelta(days=7),
            defaults={
                'end_time': now + timedelta(days=7, hours=1, minutes=30),
                'created_by': moderator,
                'max_participants': 15
            }
        )
        if created:
            self.stdout.write(f"Created next week's session: {session5.topic.title}")
        
        # Add participants to the ongoing sessions (only live ones)
        self.stdout.write("Adding participants to live sessions...")
        live_sessions = [session1, session4]
        
        for session in live_sessions:
            # Add 3-4 participants to each live session
            participants_to_add = students[:4] if session == session1 else students[1:4]
            
            for student in participants_to_add:
                participant, created = Participant.objects.get_or_create(
                    user=student,
                    session=session,
                    defaults={'is_active': True}
                )
                if created:
                    self.stdout.write(f"Added {student.username} to {session.topic.title}")
        
        self.stdout.write(self.style.SUCCESS("\nSample data created successfully!"))
        self.stdout.write("\nCreated accounts:")
        self.stdout.write("Moderator: moderator1 / password123")
        self.stdout.write("Students: student1, student2, student3, student4, student5 / password123")
        self.stdout.write("\nSession status:")
        self.stdout.write(f"Live sessions: {len([s for s in [session1, session4] if s.is_ongoing])}")
        self.stdout.write(f"Scheduled sessions: {len([session2, session3, session5])}")
        self.stdout.write(self.style.SUCCESS('Creating sample data...'))
        
        # Create users
        moderator, created = User.objects.get_or_create(
            username='moderator',
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
                'start_time': now - timedelta(hours=1),
                'end_time': now + timedelta(hours=2),
            },
            {
                'topic': topics[1] if len(topics) > 1 else DebateTopic.objects.first(),
                'start_time': now - timedelta(days=1),
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
