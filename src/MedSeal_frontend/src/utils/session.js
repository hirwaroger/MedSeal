// Session management utilities
const SESSION_KEY = 'medSeal_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Convert BigInt values to numbers or strings
const convertBigIntToNumber = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }
  
  return obj;
};

const normalizeUserRole = (role) => {
  console.log('LOG: Normalizing role:', role, 'Type:', typeof role);
  
  // Handle undefined/null cases
  if (role === undefined || role === null) {
    console.warn('LOG: Role is undefined/null, defaulting to Patient');
    return 'Patient';
  }
  
  // Handle different role formats
  if (typeof role === 'string') {
    // If it's already a string, return as-is
    console.log('LOG: Role is already a string:', role);
    return role;
  }
  
  if (typeof role === 'object' && role !== null) {
    // Handle variant format: { Doctor: null } or { Patient: null }
    if (role.hasOwnProperty('Doctor')) {
      console.log('LOG: Found Doctor role in object format');
      return 'Doctor';
    }
    if (role.hasOwnProperty('Patient')) {
      console.log('LOG: Found Patient role in object format');
      return 'Patient';
    }
    
    // Handle nested format
    if (role.role) {
      console.log('LOG: Found nested role, recursing');
      return normalizeUserRole(role.role);
    }
    
    // Handle case where object exists but has no expected properties
    console.warn('LOG: Role object exists but has no Doctor/Patient properties:', Object.keys(role));
  }
  
  // Fallback
  console.warn('LOG: Unknown role format, defaulting to Patient. Role was:', role);
  return 'Patient'; // Default fallback
};

const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') {
    console.warn('LOG: Invalid user object in normalizeUser:', user);
    return user;
  }
  
  const normalized = convertBigIntToNumber(user);
  
  // Ensure role is properly normalized with extra logging
  console.log('LOG: User before role normalization:', {
    name: normalized.name,
    role: normalized.role,
    roleType: typeof normalized.role
  });
  
  if (normalized.role !== undefined && normalized.role !== null) {
    const originalRole = normalized.role;
    normalized.role = normalizeUserRole(normalized.role);
    console.log('LOG: Role normalized from', originalRole, 'to', normalized.role);
  } else {
    console.warn('LOG: User role is undefined/null, setting default');
    normalized.role = 'Patient';
  }
  
  console.log('LOG: User after normalization:', {
    name: normalized.name,
    role: normalized.role,
    email: normalized.email
  });
  
  return normalized;
};

// Save user session
const saveSession = (user, source = 'unknown') => {
  try {
    if (!user || typeof user !== 'object') {
      console.error('LOG: Invalid user object provided to saveSession:', user);
      return false;
    }

    // Normalize the user object (BigInt conversion and role normalization)
    const normalizedUser = normalizeUser(user);
    
    console.log('LOG: Saving session for user:', normalizedUser.name, 'from source:', source);
    console.log('LOG: Normalized role:', normalizedUser.role);
    
    const sessionData = {
      user: normalizedUser,
      timestamp: Date.now(),
      source
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    console.log('LOG: Session saved successfully');
    return true;
  } catch (error) {
    console.error('LOG: Error saving session:', error);
    return false;
  }
};

// Load user session
const loadSession = () => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) {
      console.log('LOG: No session data found');
      return null;
    }

    const parsed = JSON.parse(sessionData);
    
    if (!parsed.user) {
      console.log('LOG: Session data exists but no user found');
      return null;
    }

    // Normalize the loaded user with extra validation
    console.log('LOG: Raw user from session:', parsed.user);
    const normalizedUser = normalizeUser(parsed.user);
    
    // Extra validation to ensure the user has required fields
    if (!normalizedUser.name || !normalizedUser.email || !normalizedUser.role) {
      console.error('LOG: User missing required fields after loading session:', {
        hasName: !!normalizedUser.name,
        hasEmail: !!normalizedUser.email,
        hasRole: !!normalizedUser.role,
        role: normalizedUser.role
      });
      // Clear the corrupted session
      clearSession();
      return null;
    }
    
    console.log('LOG: Session loaded successfully for user:', normalizedUser.name);
    console.log('LOG: User role after loading:', normalizedUser.role);
    
    return {
      user: normalizedUser,
      timestamp: parsed.timestamp,
      source: parsed.source || 'unknown'
    };
  } catch (error) {
    console.error('LOG: Error loading session:', error);
    // Clear corrupted session data
    clearSession();
    return null;
  }
};

// Clear user session
const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
    console.log('LOG: Session cleared');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// Update last activity timestamp
const updateActivity = () => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      parsed.timestamp = Date.now();
      localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
    }
  } catch (error) {
    console.error('Error updating activity:', error);
  }
};

// Check if session is valid
const isSessionValid = () => {
  const session = loadSession();
  return session !== null;
};

// Check if user needs registration
const needsRegistration = (isConnected, userFromBackend) => {
  if (!isConnected) return false;
  return !userFromBackend || userFromBackend === null;
};

// Get redirect path based on user role with better error handling
const getRedirectPath = (user) => {
  if (!user) {
    console.log('LOG: Invalid user for redirect:', user);
    return '/login';
  }

  // Ensure user has a role before trying to normalize it
  if (user.role === undefined || user.role === null) {
    console.error('LOG: User role is undefined/null, cannot determine redirect path. User:', user);
    return '/login'; // Force re-login if role is missing
  }

  const role = normalizeUserRole(user.role);
  console.log('LOG: Getting redirect path for role:', role);
  
  if (role === 'Doctor') {
    return '/doctor-dashboard';
  } else if (role === 'Patient') {
    return '/patient-dashboard';
  } else {
    console.warn('LOG: Unknown role for redirect:', role);
    return '/patient-dashboard'; // Default fallback
  }
};

// Debug session state and auth flow
const debugAuthState = (isConnected, user, loading, accountCheckFailed = false) => {
  console.log('DEBUG AUTH STATE:', {
    isConnected,
    hasUser: !!user,
    userName: user?.name,
    userRole: user?.role,
    loading,
    accountCheckFailed,
    timestamp: new Date().toISOString()
  });
};

export const sessionUtils = {
  saveSession,
  loadSession,
  clearSession,
  getRedirectPath,
  debugAuthState,
  normalizeUser,
  normalizeUserRole
};