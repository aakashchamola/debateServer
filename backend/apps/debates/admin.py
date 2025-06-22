from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone
from .models import DebateTopic, DebateSession, Participant, Message


@admin.register(DebateTopic)
class DebateTopicAdmin(admin.ModelAdmin):
    """Enhanced admin interface for DebateTopic"""
    list_display = ['title', 'created_by', 'session_count', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at', 'created_by__role']
    search_fields = ['title', 'description', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at', 'session_count']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'created_by', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('session_count',),
            'classes': ('collapse',)
        }),
    )
    
    def session_count(self, obj):
        count = obj.sessions.count()
        if count > 0:
            url = reverse('admin:debates_debatesession_changelist') + f'?topic__id__exact={obj.id}'
            return format_html('<a href="{}">{} sessions</a>', url, count)
        return count
    session_count.short_description = 'Sessions'


@admin.register(DebateSession)
class DebateSessionAdmin(admin.ModelAdmin):
    """Enhanced admin interface for DebateSession"""
    list_display = ['topic_title', 'start_time', 'end_time', 'created_by', 'participant_count', 'message_count', 'status', 'is_active']
    list_filter = ['is_active', 'start_time', 'created_by__role']
    search_fields = ['topic__title', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at', 'participant_count', 'message_count', 'status']
    date_hierarchy = 'start_time'
    
    fieldsets = (
        (None, {
            'fields': ('topic', 'start_time', 'end_time', 'created_by', 'max_participants', 'is_active')
        }),
        ('Statistics', {
            'fields': ('participant_count', 'message_count', 'status'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def topic_title(self, obj):
        return obj.topic.title
    topic_title.short_description = 'Topic'
    topic_title.admin_order_field = 'topic__title'
    
    def participant_count(self, obj):
        count = obj.participants.filter(is_active=True).count()
        if count > 0:
            url = reverse('admin:debates_participant_changelist') + f'?session__id__exact={obj.id}'
            return format_html('<a href="{}">{} participants</a>', url, count)
        return count
    participant_count.short_description = 'Participants'
    
    def message_count(self, obj):
        count = obj.messages.filter(is_deleted=False).count()
        if count > 0:
            url = reverse('admin:debates_message_changelist') + f'?session__id__exact={obj.id}'
            return format_html('<a href="{}">{} messages</a>', url, count)
        return count
    message_count.short_description = 'Messages'
    
    def status(self, obj):
        if obj.is_ongoing:
            return format_html('<span style="color: green;">● Ongoing</span>')
        elif obj.start_time > timezone.now():
            return format_html('<span style="color: orange;">● Upcoming</span>')
        else:
            return format_html('<span style="color: red;">● Ended</span>')
    status.short_description = 'Status'


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    """Enhanced admin interface for Participant"""
    list_display = ['user', 'session_topic', 'joined_at', 'is_active']
    list_filter = ['is_active', 'joined_at', 'user__role']
    search_fields = ['user__username', 'session__topic__title']
    readonly_fields = ['joined_at']
    date_hierarchy = 'joined_at'
    
    def session_topic(self, obj):
        return f"{obj.session.topic.title} ({obj.session.start_time.strftime('%Y-%m-%d %H:%M')})"
    session_topic.short_description = 'Session'
    session_topic.admin_order_field = 'session__topic__title'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Enhanced admin interface for Message"""
    list_display = ['sender', 'session_topic', 'content_preview', 'timestamp', 'is_deleted']
    list_filter = ['is_deleted', 'timestamp', 'sender__role']
    search_fields = ['sender__username', 'content', 'session__topic__title']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    actions = ['delete_messages', 'restore_messages']
    
    fieldsets = (
        (None, {
            'fields': ('session', 'sender', 'content', 'is_deleted')
        }),
        ('Metadata', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        }),
    )
    
    def session_topic(self, obj):
        return obj.session.topic.title
    session_topic.short_description = 'Session Topic'
    session_topic.admin_order_field = 'session__topic__title'
    
    def content_preview(self, obj):
        if len(obj.content) > 50:
            return obj.content[:50] + "..."
        return obj.content
    content_preview.short_description = 'Content'
    
    def delete_messages(self, request, queryset):
        updated = queryset.update(is_deleted=True)
        self.message_user(request, f'{updated} messages marked as deleted.')
    delete_messages.short_description = "Mark selected messages as deleted"
    
    def restore_messages(self, request, queryset):
        updated = queryset.update(is_deleted=False)
        self.message_user(request, f'{updated} messages restored.')
    restore_messages.short_description = "Restore selected messages"


# Custom admin site configuration
admin.site.site_header = "Online Debate Platform Administration"
admin.site.site_title = "Debate Platform Admin"
admin.site.index_title = "Welcome to Debate Platform Administration"
