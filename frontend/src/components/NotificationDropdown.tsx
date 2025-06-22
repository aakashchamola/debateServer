import { useState, useEffect } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Button,
  Badge,
  Card,
  CardContent 
} from '@/components/ui';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import type { Notification, PaginatedResponse } from '@/types';

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsRes, unreadCountRes] = await Promise.all([
        apiService.getNotifications(),
        apiService.getUnreadNotificationCount()
      ]);
      setNotifications((notificationsRes.data.results || []) as unknown as Notification[]);
      setUnreadCount(unreadCountRes.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await apiService.markNotificationRead(notification.id);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate to action URL if provided
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'debate_message':
        return '💬';
      case 'debate_invite':
        return '📨';
      case 'debate_result':
        return '🏆';
      case 'achievement':
        return '🎖️';
      case 'moderation':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <Card 
                key={notification.id} 
                className={`m-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-950' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg flex-shrink-0">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium truncate ${
                          !notification.is_read ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {notification.time_ago}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {notifications.length > 10 && (
          <div className="p-3 border-t text-center">
            <Button variant="ghost" size="sm" className="text-xs">
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
