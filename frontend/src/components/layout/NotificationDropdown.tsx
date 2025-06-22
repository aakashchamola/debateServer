import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';
import { getTimeAgo } from '@/utils';

interface Notification {
  id: string;
  type: 'debate_invite' | 'debate_result' | 'achievement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'debate_invite',
    title: 'New Debate Invitation',
    message: "You've been invited to 'Climate Change Solutions'",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isRead: false,
  },
  {
    id: '2',
    type: 'debate_result',
    title: 'Debate Concluded',
    message: 'The debate "AI Ethics" has ended. See the results.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: false,
  },
  {
    id: '3',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'You earned the "First Victory" badge.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isRead: true,
  },
];

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map((n) => ({ ...n, isRead: true }))
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} unread</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex items-start gap-3 p-3',
                  !notification.isRead && 'bg-accent'
                )}
              >
                <div
                  className={cn(
                    'h-2 w-2 rounded-full mt-2',
                    !notification.isRead ? 'bg-primary' : 'bg-transparent'
                  )}
                />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getTimeAgo(notification.timestamp)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="flex items-center justify-center gap-2"
        >
          <Check className="h-4 w-4" />
          <span>Mark all as read</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
