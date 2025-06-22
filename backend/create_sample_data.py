#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.debates.models import DebateTopic, DebateSession, Participant

User = get_user_model()

def create_sample_data():
    print("Creating sample data...")
    
    # Create users
    print("Creating users...")
    
    # Create moderator
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
        print(f"Created moderator: {moderator.username}")
    
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
            print(f"Created student: {student.username}")
        students.append(student)
    
    # Create debate topics
    print("Creating debate topics...")
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
            print(f"Created topic: {topic.title}")
        topics.append(topic)
    
    # Create debate sessions
    print("Creating debate sessions...")
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
        print(f"Created ongoing session: {session1.topic.title}")
    
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
        print(f"Created scheduled session: {session2.topic.title}")
    
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
        print(f"Created tomorrow's session: {session3.topic.title}")
    
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
        print(f"Created another ongoing session: {session4.topic.title}")
    
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
        print(f"Created next week's session: {session5.topic.title}")
    
    # Add participants to the ongoing sessions (only live ones)
    print("Adding participants to live sessions...")
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
                print(f"Added {student.username} to {session.topic.title}")
    
    print("\nSample data created successfully!")
    print("\nCreated accounts:")
    print("Moderator: moderator1 / password123")
    print("Students: student1, student2, student3, student4, student5 / password123")
    print("\nSession status:")
    print(f"Live sessions: {len([s for s in [session1, session4] if s.is_ongoing])}")
    print(f"Scheduled sessions: {len([session2, session3, session5])}")

if __name__ == '__main__':
    create_sample_data()
