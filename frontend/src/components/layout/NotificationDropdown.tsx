import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, MessageSquare, Users, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

interface Notification {
  id: string;
  type: 'debate_invite' | 'debate_result' | 'achievement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

// Mock data - replace with actual API call
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'debate_invite',
    title: 'New Debate Invitation',
    message: 'You\'ve been invited to join "Climate Change Solutions"',
    timestamp: '2025-06-22T10:30:00Z',
    isRead: false,
    actionUrl: '/debates/123'
  },
  {
    id: '2',
    type: 'debate_result',
    title: 'Debate Concluded',
    message: 'The debate "AI Ethics" has ended. Check the results!',
    timestamp: '2025-06-22T09:15:00Z',
    isRead: false,
    actionUrl: '/debates/456/results'
  },
  {
    id: '3',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'You\'ve earned the "Persuasive Debater" badge',
    timestamp: '2025-06-21T16:45:00Z',
    isRead: true,
    actionUrl: '/profile/achievements'
  },
  {
    id: '4',
    type: 'system',
    title: 'Platform Update',
    message: 'New features have been added to improve your debate experience',
    timestamp: '2025-06-21T12:00:00Z',
    isRead: true,
    actionUrl: '/updates'
  }
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'debate_invite':
      return <MessageSquare className="h-4 w-4" />;
    case 'debate_result':
      return <Users className="h-4 w-4" />;
    case 'achievement':
      return <Award className="h-4 w-4" />;
    case 'system':
      return <Bell className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return time.toLocaleDateString();
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notification-trigger"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <Card className="notification-card">
            <div className="notification-header">
              <h3 className="text-lg font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="btn btn-ghost btn-sm"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </button>
              )}
            </div>

            <CardContent className="notification-list">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <Bell className="h-12 w-12 text-secondary mx-auto mb-3" />
                  <p className="text-secondary text-center">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">
                          {notification.title}
                        </div>
                        <div className="notification-message">
                          {notification.message}
                        </div>
                        <div className="notification-time">
                          {formatTimeAgo(notification.timestamp)}
                        </div>
                      </div>
                      <div className="notification-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="notification-action-btn"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {!notification.isRead && (
                        <div className="notification-unread-dot"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
