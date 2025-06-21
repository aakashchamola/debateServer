from django.contrib import admin
from voting.models import Vote


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    """Admin interface for Vote"""
    list_display = ['session', 'user', 'choice', 'timestamp']
    list_filter = ['choice', 'timestamp']
    search_fields = ['user__username', 'session__topic__title']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'user', 'session', 'session__topic'
        )
