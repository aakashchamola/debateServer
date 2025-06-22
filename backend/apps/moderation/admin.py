from django.contrib import admin
from .models import ModerationAction


@admin.register(ModerationAction)
class ModerationActionAdmin(admin.ModelAdmin):
    """Admin interface for ModerationAction"""
    list_display = ['action', 'participant', 'session', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['participant__username', 'session__topic__title']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'participant', 'session', 'session__topic'
        )
