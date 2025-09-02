import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const SessionManager: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for storage events to handle multi-tab logout
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token' && !event.newValue && isAuthenticated) {
        addNotification({
          type: 'info',
          title: 'Session Ended',
          message: 'You have been logged out from another tab.',
        });
        logout();
      }
    };

    // Listen for online/offline events
    const handleOnline = () => {
      if (isAuthenticated) {
        addNotification({
          type: 'success',
          title: 'Connection Restored',
          message: 'Your internet connection has been restored.',
        });
      }
    };

    const handleOffline = () => {
      if (isAuthenticated) {
        addNotification({
          type: 'warning',
          title: 'Connection Lost',
          message: 'You are now offline. Some features may not work properly.',
        });
      }
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, logout, addNotification]);

  return null; // This component doesn't render anything
};

export default SessionManager;
