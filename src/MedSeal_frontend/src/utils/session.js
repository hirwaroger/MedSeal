// Session management utilities
const SESSION_KEY = 'medSeal_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const sessionUtils = {
  // Save user session
  saveSession: (user, currentView = 'dashboard') => {
    try {
      // Validate user object has required fields before saving
      if (!user || !user.name || !user.id) {
        console.error('Invalid user data for session', user);
        return false;
      }
      
      const sessionData = {
        user,
        currentView,
        timestamp: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
        isAuthenticated: true,
        walletConnected: true
      };
      
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      console.log('Session saved successfully for user:', user.name);
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  },

  // Load user session
  loadSession: () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) {
        console.log('No session data found in localStorage');
        return null;
      }

      const session = JSON.parse(sessionData);
      const now = Date.now();

      // Check if session has expired
      if (now > session.expiresAt) {
        console.log('Session has expired, clearing...');
        sessionUtils.clearSession();
        return null;
      }

      // Check if session is older than 6 hours - require re-authentication for security
      const sixHours = 6 * 60 * 60 * 1000;
      if (now - session.timestamp > sixHours) {
        console.log('Session is too old, requiring re-authentication');
        sessionUtils.clearSession();
        return null;
      }
      
      // Verify user object has required data
      if (!session.user || !session.user.name || !session.user.id) {
        console.error('Invalid user data in session', session.user);
        sessionUtils.clearSession();
        return null;
      }

      console.log('Valid session loaded for user:', session.user.name);
      return session;
    } catch (error) {
      console.error('Error loading session:', error);
      sessionUtils.clearSession();
      return null;
    }
  },

  // Clear user session
  clearSession: () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      console.log('Session cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  },

  // Update last activity timestamp
  updateActivity: () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.timestamp = Date.now();
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        console.log('Session activity updated');
      }
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  },

  // Check if session is valid
  isSessionValid: () => {
    const session = sessionUtils.loadSession();
    return session !== null;
  },

  // Check if user needs registration
  needsRegistration: (isConnected, userFromBackend) => {
    if (!isConnected) return false;
    return !userFromBackend || userFromBackend === null;
  },

  // Get redirect path based on user role
  getRedirectPath: (user) => {
    if (!user) return '/login';
    
    // Make sure user has a role before trying to process it
    if (!user.role) {
      console.error('User has no role defined', user);
      return '/login';
    }
    
    const userRole = typeof user.role === 'string' ? user.role : 
                    (user.role?.Doctor !== undefined ? 'Doctor' : 'Patient');
    return userRole === 'Doctor' ? '/doctor' : '/patient';
  },
  
  // Debug session state and auth flow
  debugAuthState: (isConnected, user, loading) => {
    const sessionData = localStorage.getItem(SESSION_KEY);
    const hasSession = !!sessionData;
    let sessionUser = null;
    
    try {
      if (hasSession) {
        const session = JSON.parse(sessionData);
        sessionUser = session.user;
      }
    } catch (e) {
      console.error('Failed to parse session data:', e);
    }
    
    console.table({
      isConnected,
      loading,
      hasUser: !!user,
      userId: user?.id || 'none',
      userName: user?.name || 'none',
      hasSession,
      sessionUserId: sessionUser?.id || 'none',
      sessionUserName: sessionUser?.name || 'none'
    });
    
    return {
      isConnected,
      loading,
      hasUser: !!user,
      hasSession,
      sessionValid: hasSession && sessionUser?.id === user?.id
    };
  }
};