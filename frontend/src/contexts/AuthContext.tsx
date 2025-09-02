import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'salesperson';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, authToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Session management for auto logout
  const SESSION_KEY = 'ims_session_active';
  const HEARTBEAT_INTERVAL = 5000; // 5 seconds
  const SESSION_TIMEOUT = 30000; // 30 seconds

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem(SESSION_KEY);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout API to log the logout event
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => {
          // Ignore fetch errors during logout
        });
      }
    } catch (error) {
      // Ignore errors during logout
    } finally {
      clearAuthData();
      // Force reload to ensure clean state
      window.location.href = '/login';
    }
  }, [clearAuthData, token]);

  // Update session heartbeat
  const updateSessionHeartbeat = useCallback(() => {
    if (isAuthenticated) {
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
    }
  }, [isAuthenticated]);

  // Check if session is still active
  const checkSessionActive = useCallback(() => {
    const lastHeartbeat = sessionStorage.getItem(SESSION_KEY);
    if (!lastHeartbeat) return false;
    
    const now = Date.now();
    const lastActivity = parseInt(lastHeartbeat);
    return (now - lastActivity) < SESSION_TIMEOUT;
  }, []);

  useEffect(() => {
    // Check for existing authentication on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Check if session is still active (for tab restoration)
        const isSessionActive = checkSessionActive();
        
        if (isSessionActive || !sessionStorage.getItem(SESSION_KEY)) {
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          updateSessionHeartbeat();
        } else {
          // Session expired, clear data
          clearAuthData();
        }
      } catch (error) {
        // Clear invalid data
        clearAuthData();
      }
    }
  }, [checkSessionActive, updateSessionHeartbeat, clearAuthData]);

  // Auto logout functionality
  useEffect(() => {
    if (!isAuthenticated) return;

    // Set up heartbeat interval to keep session alive
    const heartbeatInterval = setInterval(updateSessionHeartbeat, HEARTBEAT_INTERVAL);

    // Set up session check interval
    const sessionCheckInterval = setInterval(() => {
      if (!checkSessionActive()) {
        console.log('Session expired due to inactivity');
        logout();
      }
    }, HEARTBEAT_INTERVAL);

    // Handle page visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible, check if session is still active
        if (!checkSessionActive()) {
          console.log('Session expired while tab was hidden');
          logout();
        } else {
          updateSessionHeartbeat();
        }
      }
    };

    // Handle beforeunload event (tab/browser closing)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Clear session data when tab/browser is closing
      sessionStorage.removeItem(SESSION_KEY);
      
      // Optional: Show confirmation dialog
      event.preventDefault();
      event.returnValue = 'Are you sure you want to leave? You will be logged out.';
      return event.returnValue;
    };

    // Handle unload event (tab/browser closed)
    const handleUnload = () => {
      // Clear session data
      sessionStorage.removeItem(SESSION_KEY);
      
      // Send logout request if possible (limited time)
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/logout', JSON.stringify({ token }));
      }
    };

    // Handle storage changes (for multi-tab support)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token' && !event.newValue) {
        // Token was removed in another tab, logout this tab too
        console.log('Logged out from another tab');
        clearAuthData();
        window.location.href = '/login';
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(sessionCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, token, updateSessionHeartbeat, checkSessionActive, logout, clearAuthData]);

  const login = (userData: User, authToken: string) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
    updateSessionHeartbeat();
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
