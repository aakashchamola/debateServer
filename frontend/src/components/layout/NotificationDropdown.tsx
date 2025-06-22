// import { useState, useEffect } from 'react';
// import { Bell, Check } from 'lucide-react';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Button } from '@/components/ui/Button';
// import { Badge } from '@/components/ui/badge';
// import { cn } from '@/utils';
// import { apiService } from '@/services/api';
// import type { Notification } from '@/types';

// export function NotificationDropdown() {
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);

//   useEffect(() => {
//     fetchNotifications();
//     fetchUnreadCount();
//   }, []);

//   const fetchNotifications = async () => {
//     try {
//       setLoading(true);
//       const response = await apiService.getNotifications();
//       setNotifications(response.data.results || []);
//     } catch (error) {
//       console.error('Error fetching notifications:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchUnreadCount = async () => {
//     try {
//       const response = await apiService.getUnreadNotificationCount();
//       setUnreadCount(response.data.unread_count);
//     } catch (error) {
//       console.error('Error fetching unread count:', error);
//     }
//   };

//   const handleMarkAllAsRead = async () => {
//     try {
//       await apiService.markAllNotificationsRead();
//       // Update local state
//       setNotifications(notifications.map(n => ({ ...n, is_read: true })));
//       setUnreadCount(0);
//     } catch (error) {
//       console.error('Error marking all as read:', error);
//     }
//   };

//   const handleMarkAsRead = async (notificationId: number) => {
//     try {
//       await apiService.markNotificationRead(notificationId);
//       // Update local state
//       setNotifications(notifications.map(n => 
//         n.id === notificationId ? { ...n, is_read: true } : n
//       ));
//       setUnreadCount(prev => Math.max(0, prev - 1));
//     } catch (error) {
//       console.error('Error marking notification as read:', error);
//     }
//   };

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant="ghost" size="icon" className="relative">
//           <Bell className="h-5 w-5" />
//           {unreadCount > 0 && (
//             <Badge
//               variant="destructive"
//               className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0"
//             >
//               {unreadCount}
//             </Badge>
//           )}
//           <span className="sr-only">Notifications</span>
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end" className="w-80">
//         <DropdownMenuLabel className="flex items-center justify-between">
//           <span>Notifications</span>
//           {unreadCount > 0 && (
//             <Badge variant="secondary">{unreadCount} unread</Badge>
//           )}
//         </DropdownMenuLabel>
//         <DropdownMenuSeparator />
//         <div className="max-h-80 overflow-y-auto">
//           {loading ? (
//             <div className="py-8 text-center text-sm text-muted-foreground">
//               Loading notifications...
//             </div>
//           ) : notifications.length > 0 ? (
//             notifications.map((notification) => (
//               <DropdownMenuItem
//                 key={notification.id}
//                 className={cn(
//                   'flex items-start gap-3 p-3 cursor-pointer',
//                   !notification.is_read && 'bg-accent'
//                 )}
//                 onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
//               >
//                 <div
//                   className={cn(
//                     'h-2 w-2 rounded-full mt-2',
//                     !notification.is_read ? 'bg-primary' : 'bg-transparent'
//                   )}
//                 />
//                 <div className="flex-1 space-y-1">
//                   <p className="font-semibold">{notification.title}</p>
//                   <p className="text-sm text-muted-foreground">
//                     {notification.message}
//                   </p>
//                   <p className="text-xs text-muted-foreground">
//                     {notification.time_ago}
//                   </p>
//                 </div>
//               </DropdownMenuItem>
//             ))
//           ) : (
//             <div className="py-8 text-center text-sm text-muted-foreground">
//               No notifications yet
//             </div>
//           )}
//         </div>
//         <DropdownMenuSeparator />
//         <DropdownMenuItem
//           onClick={handleMarkAllAsRead}
//           disabled={unreadCount === 0}
//           className="flex items-center justify-center gap-2"
//         >
//           <Check className="h-4 w-4" />
//           <span>Mark all as read</span>
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }
