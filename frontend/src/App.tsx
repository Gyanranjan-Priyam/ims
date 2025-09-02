
import AppRoutes from './AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ActivityTracker from './components/ActivityTracker';
import LogoutWarning from './components/LogoutWarning';
import SessionManager from './components/SessionManager';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SessionManager />
        <ActivityTracker inactivityTimeout={30 * 60 * 1000}> {/* 30 minutes */}
          <AppRoutes />
          <LogoutWarning 
            warningTime={28 * 60 * 1000} // Show warning 2 minutes before logout
            countdownTime={2 * 60 * 1000} // 2 minute countdown
          />
        </ActivityTracker>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
