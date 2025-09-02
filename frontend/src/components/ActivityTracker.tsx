import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ActivityTrackerProps {
  children: React.ReactNode;
  inactivityTimeout?: number; // in milliseconds
}

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ 
  children, 
  inactivityTimeout = 30 * 60 * 1000 // 30 minutes default
}) => {
  const { isAuthenticated, logout } = useAuth();

  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;

    // Clear existing timer
    if (window.inactivityTimer) {
      clearTimeout(window.inactivityTimer);
    }

    // Set new timer
    window.inactivityTimer = setTimeout(() => {
      console.log('User inactive for too long, logging out...');
      logout();
    }, inactivityTimeout);
  }, [isAuthenticated, logout, inactivityTimeout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Start the timer initially
    resetInactivityTimer();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      
      if (window.inactivityTimer) {
        clearTimeout(window.inactivityTimer);
      }
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // Handle page focus/blur for additional tracking
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated) {
        resetInactivityTimer();
      }
    };

    const handleBlur = () => {
      // When page loses focus, we might want to reduce the timeout
      // or handle it differently
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isAuthenticated, resetInactivityTimer]);

  return <>{children}</>;
};

// Extend Window interface to include our timer
declare global {
  interface Window {
    inactivityTimer?: NodeJS.Timeout;
  }
}

export default ActivityTracker;
