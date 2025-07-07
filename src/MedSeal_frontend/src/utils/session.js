// Session management utilities
export const SESSION_STORAGE_KEYS = {
  USER_SESSION: 'medseal_session',
  CURRENT_VIEW: 'medseal_current_view',
  LAST_ACTIVITY: 'medseal_last_activity'
};

// Session timeout in milliseconds (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

export const sessionUtils = {
  // Save user session
  saveSession: (user, view = 'dashboard') => {
    try {
      console.log('Saving session for user:', user.name, 'view:', view);
      
      const sessionData = {
        user,
        timestamp: Date.now(),
        view
      };
      
      localStorage.setItem(SESSION_STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
      localStorage.setItem(SESSION_STORAGE_KEYS.CURRENT_VIEW, view);
      localStorage.setItem(SESSION_STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
      
      console.log('Session saved successfully');
      
      // Verify the session was saved
      const saved = localStorage.getItem(SESSION_STORAGE_KEYS.USER_SESSION);
      console.log('Verification - saved session exists:', !!saved);
      
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  },

  // Load user session
  loadSession: () => {
    try {
      console.log('Loading session from localStorage...');
      
      const sessionData = localStorage.getItem(SESSION_STORAGE_KEYS.USER_SESSION);
      const lastActivity = localStorage.getItem(SESSION_STORAGE_KEYS.LAST_ACTIVITY);
      
      console.log('Session data exists:', !!sessionData);
      console.log('Last activity exists:', !!lastActivity);
      
      if (!sessionData || !lastActivity) {
        console.log('No session data found');
        return null;
      }

      const session = JSON.parse(sessionData);
      const activityTime = parseInt(lastActivity);
      const now = Date.now();

      console.log('Session parsed:', session.user?.name);
      console.log('Activity time:', new Date(activityTime));
      console.log('Current time:', new Date(now));
      console.log('Time difference (hours):', (now - activityTime) / (1000 * 60 * 60));

      // Check if session has expired
      if (now - activityTime > SESSION_TIMEOUT) {
        console.log('Session expired, clearing...');
        sessionUtils.clearSession();
        return null;
      }

      // Update last activity
      localStorage.setItem(SESSION_STORAGE_KEYS.LAST_ACTIVITY, now.toString());
      
      console.log('Session loaded successfully for user:', session.user.name);
      return {
        user: session.user,
        view: session.view || 'dashboard'
      };
    } catch (error) {
      console.error('Error loading session:', error);
      sessionUtils.clearSession();
      return null;
    }
  },

  // Clear user session
  clearSession: () => {
    try {
      console.log('Clearing session...');
      Object.values(SESSION_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('Session cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  },

  // Check if session is valid
  isSessionValid: () => {
    try {
      const lastActivity = localStorage.getItem(SESSION_STORAGE_KEYS.LAST_ACTIVITY);
      if (!lastActivity) return false;

      const activityTime = parseInt(lastActivity);
      const now = Date.now();

      return (now - activityTime) <= SESSION_TIMEOUT;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  },

  // Update last activity timestamp
  updateActivity: () => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }
};
