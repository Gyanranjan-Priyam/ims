import { useState } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Eye, 
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  CreditCard,
  Settings,
  Package,
  TrendingUp,
  Info,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { useNotifications } from '../../contexts/NotificationContext';
import type { Notification } from '../../contexts/NotificationContext';

interface NotificationPanelProps {
  children?: React.ReactNode;
  className?: string;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ children, className }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    permanentlyDeleteNotification,
    clearAllNotifications,
    refreshNotifications
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      order: ShoppingCart,
      warning: AlertTriangle,
      payment: CreditCard,
      system: Settings,
      stock: Package,
      customer: User,
      sale: TrendingUp,
      info: Info,
      error: XCircle,
      success: CheckCircle
    };
    
    const IconComponent = iconMap[type as keyof typeof iconMap] || Info;
    return <IconComponent className="h-4 w-4" />;
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'text-red-600 bg-red-50';
    
    const colorMap = {
      order: 'text-green-600 bg-green-50',
      warning: 'text-orange-600 bg-orange-50',
      payment: 'text-blue-600 bg-blue-50',
      system: 'text-gray-600 bg-gray-50',
      stock: 'text-purple-600 bg-purple-50',
      customer: 'text-indigo-600 bg-indigo-50',
      sale: 'text-emerald-600 bg-emerald-50',
      info: 'text-blue-600 bg-blue-50',
      error: 'text-red-600 bg-red-50',
      success: 'text-green-600 bg-green-50'
    };
    
    return colorMap[type as keyof typeof colorMap] || 'text-gray-600 bg-gray-50';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <Badge className={cn('text-xs border', variants[priority as keyof typeof variants])}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'priority':
        return notification.priority === 'urgent' || notification.priority === 'high';
      default:
        return true;
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const NotificationItem: React.FC<{ notification: Notification; showActions?: boolean }> = ({ 
    notification, 
    showActions = true 
  }) => (
    <div
      className={cn(
        "group flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors duration-150 cursor-pointer border-l-3",
        notification.read ? "border-l-transparent" : "border-l-blue-500 bg-blue-50/30"
      )}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className={cn(
        "p-3 rounded-lg flex-shrink-0",
        getNotificationColor(notification.type, notification.priority)
      )}>
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "text-sm font-medium truncate pr-4",
              notification.read ? "text-slate-700" : "text-slate-900"
            )}>
              {notification.title}
            </h4>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {getPriorityBadge(notification.priority)}
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
        </div>
        
        <p className="text-xs text-slate-600 mb-3 line-clamp-3 leading-relaxed">
          {notification.message}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {getRelativeTime(notification.createdAt)}
          </span>
          
          {showActions && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-green-100 border border-green-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification._id);
                  }}
                  title="Mark as read"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 border border-red-200"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification._id);
                }}
                title="Delete notification (can be restored)"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 px-3 text-xs font-medium text-white bg-red-600 hover:bg-red-700 border-2 border-red-700 shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to permanently delete this notification? This action cannot be undone.')) {
                    permanentlyDeleteNotification(notification._id);
                  }
                }}
                title="Permanently delete from database - Cannot be undone!"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Forever
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Notification Bell Trigger */}
      <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {children || (
              <Button 
                variant="ghost" 
                size="sm"
                className={cn(
                  "relative p-2 hover:bg-slate-100 transition-all duration-200 hover:scale-105",
                  className
                )}
              >
                <Bell className="h-5 w-5 text-slate-600" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            )}
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-96 p-0" align="end">
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={refreshNotifications}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                  </Button>
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex items-center gap-1">
                {(['all', 'unread', 'priority'] as const).map((filterType) => (
                  <Button
                    key={filterType}
                    variant={filter === filterType ? "default" : "ghost"}
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setFilter(filterType)}
                  >
                    {filterType === 'all' && 'All'}
                    {filterType === 'unread' && 'Unread'}
                    {filterType === 'priority' && 'Priority'}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Notifications List */}
            <ScrollArea className="max-h-96">
              <div className="divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">
                      {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                    </p>
                  </div>
                ) : (
                  <div className="group">
                    {filteredNotifications.slice(0, 3).map((notification) => (
                      <NotificationItem 
                        key={notification._id} 
                        notification={notification}
                        showActions={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Footer */}
            <div className="p-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <DialogTrigger asChild>
                  <Button variant="ghost" className="flex-1 text-sm text-blue-600 hover:bg-blue-50">
                    <Eye className="h-4 w-4 mr-2" />
                    View All {filteredNotifications.length > 3 ? `(${filteredNotifications.length - 3} more)` : ''}
                  </Button>
                </DialogTrigger>
                
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    className="flex-1 text-sm text-green-600 hover:bg-green-50"
                    onClick={markAllAsRead}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                )}
              </div>
              
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-sm text-red-600 hover:bg-red-50"
                  onClick={clearAllNotifications}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View All Dialog */}
        <DialogContent className="max-w-[98vw] max-h-[95vh] w-[98vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              All Notifications
            </DialogTitle>
            <DialogDescription>
              Manage your notifications and stay updated with important information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Totals and Unread Count */}
            <div className="flex items-center justify-center gap-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
                <div className="text-sm text-blue-700 font-medium">Total Notifications</div>
              </div>
              <div className="h-8 w-px bg-blue-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
                <div className="text-sm text-orange-700 font-medium">Unread Notifications</div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshNotifications}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Check className="h-4 w-4" />
                  Mark All Read
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllNotifications}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>
            
            {/* All Notifications - Single Column */}
            <ScrollArea className="h-[65vh]">
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="p-16 text-center">
                    <Bell className="h-20 w-20 mx-auto text-slate-300 mb-6" />
                    <h3 className="text-xl font-medium text-slate-900 mb-3">No notifications</h3>
                    <p className="text-base text-slate-500">
                      You're all caught up! New notifications will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification._id} className="border border-slate-200 rounded-lg hover:shadow-lg transition-all duration-200 hover:border-slate-300">
                      <NotificationItem 
                        notification={notification}
                        showActions={true}
                      />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationPanel;
