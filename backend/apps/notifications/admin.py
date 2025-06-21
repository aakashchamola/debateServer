from django.contrib import admin
from notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for Notification"""
    list_display = ['message_preview', 'user', 'is_read', 'timestamp']
    list_filter = ['is_read', 'timestamp']
    search_fields = ['message', 'user__username']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def message_preview(self, obj):
        if len(obj.message) > 50:
            return obj.message[:50] + "..."
        return obj.message
    message_preview.short_description = 'Message'
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = "Mark selected notifications as read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} notifications marked as unread.')
    mark_as_unread.short_description = "Mark selected notifications as unread"
