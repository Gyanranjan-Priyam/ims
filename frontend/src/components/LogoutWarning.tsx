import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle, Clock } from 'lucide-react';

interface LogoutWarningProps {
  warningTime?: number; // Time before logout to show warning (in ms)
  countdownTime?: number; // Countdown duration (in ms)
}

const LogoutWarning: React.FC<LogoutWarningProps> = ({
  warningTime = 2 * 60 * 1000, // 2 minutes before logout
  countdownTime = 60 * 1000 // 1 minute countdown
}) => {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    let warningTimer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const startWarningTimer = () => {
      // Clear existing timer
      if (warningTimer) clearTimeout(warningTimer);

      warningTimer = setTimeout(() => {
        setShowWarning(true);
        setCountdown(Math.floor(countdownTime / 1000));

        // Start countdown
        countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              // Time's up, logout
              logout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningTime);
    };

    const resetWarningTimer = () => {
      if (warningTimer) clearTimeout(warningTimer);
      if (countdownInterval) clearInterval(countdownInterval);
      setShowWarning(false);
      setCountdown(0);
      startWarningTimer();
    };

    // Activity events to reset the warning timer
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
      document.addEventListener(event, resetWarningTimer, true);
    });

    // Start initial timer
    startWarningTimer();

    // Cleanup
    return () => {
      if (warningTimer) clearTimeout(warningTimer);
      if (countdownInterval) clearInterval(countdownInterval);
      events.forEach(event => {
        document.removeEventListener(event, resetWarningTimer, true);
      });
    };
  }, [isAuthenticated, logout, warningTime, countdownTime]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    setCountdown(0);
    
    // Reset the inactivity timer by simulating user activity
    document.dispatchEvent(new Event('click'));
  };

  const handleLogoutNow = () => {
    logout();
  };

  if (!showWarning || !isAuthenticated) return null;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Session Timeout Warning
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            You will be automatically logged out due to inactivity.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <div className="flex items-center gap-2 text-2xl font-bold text-red-600 mb-2">
            <Clock className="h-6 w-6" />
            {countdown} seconds
          </div>
          <p className="text-sm text-slate-600 text-center">
            Click "Stay Logged In" to continue your session, or you will be automatically logged out.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={handleLogoutNow}
            className="flex-1"
          >
            Logout Now
          </Button>
          <Button
            onClick={handleStayLoggedIn}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogoutWarning;
