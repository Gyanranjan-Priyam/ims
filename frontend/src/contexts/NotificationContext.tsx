import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import api from '../lib/api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'order' | 'warning' | 'payment' | 'system' | 'stock' | 'customer' | 'sale' | 'info' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  userId?: string;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  addNotification: (notification: Partial<Notification>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  permanentlyDeleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  fetchNotifications: () => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user info from localStorage or auth context
  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Handle both _id and id formats from different API endpoints
      if (user.id && !user._id) {
        user._id = user.id;
      }
      return user;
    } catch {
      return {};
    }
  };

  // Real-time notification polling
  useEffect(() => {
    const user = getCurrentUser();
    if (user._id) {
      fetchNotifications();
      
      // Set up polling for real-time updates every 30 seconds
      const pollInterval = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => clearInterval(pollInterval);
    }
  }, []);

  // WebSocket connection for real-time notifications (optional)
  useEffect(() => {
    // This can be enhanced with WebSocket connection later
    // For now, we'll use polling approach
  }, []);

  const fetchNotifications = async () => {
    const user = getCurrentUser();
    console.log('🔔 fetchNotifications called for user:', user);
    if (!user._id) {
      console.log('❌ No user ID found, skipping fetch');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📡 Making API call to /notifications...');
      const response = await api.get(`/notifications?limit=50`);
      console.log('📊 API response:', response);
      const fetchedNotifications = response.data.data || [];
      console.log('📋 Fetched notifications:', fetchedNotifications);
      
      // Set notifications from API only
      console.log('✅ Using API notifications');
      setNotifications(fetchedNotifications);
    } catch (err: any) {
      console.error('❌ Error fetching notifications:', err);
      // Set empty array if API fails
      setNotifications([]);
      setError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const addNotification = async (notification: Partial<Notification>) => {
    try {
      const user = getCurrentUser();
      const newNotification = {
        ...notification,
        userId: user._id,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Try to save to backend
      try {
        const response = await api.post('/notifications', newNotification);
        setNotifications(prev => [response.data, ...prev]);
      } catch (err) {
        // Fallback to local state if API fails
        const localNotification = {
          ...newNotification,
          _id: `local-${Date.now()}`
        } as Notification;
        setNotifications(prev => [localNotification, ...prev]);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}`, { read: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
    
    // Update local state
    setNotifications(prev =>
      prev.map(notification =>
        notification._id === notificationId
          ? { ...notification, read: true, updatedAt: new Date().toISOString() }
          : notification
      )
    );
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
    
    // Update local state
    setNotifications(prev =>
      prev.map(notification => ({ 
        ...notification, 
        read: true, 
        updatedAt: new Date().toISOString() 
      }))
    );
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
    
    // Remove from local state
    setNotifications(prev =>
      prev.filter(notification => notification._id !== notificationId)
    );
  };

  const permanentlyDeleteNotification = async (notificationId: string) => {
    try {
      // Delete permanently from database
      await api.delete(`/notifications/${notificationId}/permanent`);
    } catch (err) {
      console.error('Error permanently deleting notification:', err);
    }
    
    // Remove from local state
    setNotifications(prev =>
      prev.filter(notification => notification._id !== notificationId)
    );
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications/clear');
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
    
    // Clear local state
    setNotifications([]);
  };

  const refreshNotifications = () => {
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    error,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    permanentlyDeleteNotification,
    clearAllNotifications,
    fetchNotifications,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
