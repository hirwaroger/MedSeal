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
    // Handle variant format: { Doctor: null } or { Patient: null } or { Admin: null }
    if (role.hasOwnProperty('Doctor')) {
      console.log('LOG: Found Doctor role in object format');
      return 'Doctor';
    }
    if (role.hasOwnProperty('Patient')) {
      console.log('LOG: Found Patient role in object format');
      return 'Patient';
    }
    if (role.hasOwnProperty('Admin')) {
      console.log('LOG: Found Admin role in object format');
      return 'Admin';
    }

    // ngo 
    if (role.hasOwnProperty('NGO')) {
      console.log('LOG: Found NGO role in object format');
      return 'NGO';
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
  
  // Handle case where user might be wrapped in an array
  let actualUser = user;
  if (Array.isArray(user) && user.length > 0) {
    console.log('LOG: User is an array, taking first element');
    actualUser = user[0];
  }
  
  const normalized = convertBigIntToNumber(actualUser);
  
  // Ensure role is properly normalized with extra logging
  console.log('LOG: User before role normalization:', {
    name: normalized.name,
    role: normalized.role,
    roleType: typeof normalized.role,
    hasRole: normalized.role !== undefined && normalized.role !== null
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
    email: normalized.email,
    id: normalized.id
  });
  
  return normalized;
};

// Save user session
const saveSession = (user, currentView = 'dashboard') => {
  try {
    const sessionData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        license_number: user.license_number || '',
        user_principal: user.user_principal || '',
        created_at: user.created_at || Date.now(),
        verification_status: user.verification_status || 'NotRequired',
        last_active: user.last_active,
        total_prescriptions: user.total_prescriptions || 0,
        total_medicines: user.total_medicines || 0,
      },
      currentView,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    console.log('LOG: Session saved successfully for user:', user.name);
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
    
    // Check if session is expired (24 hours)
    const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
    if (isExpired) {
      console.log('LOG: Session expired, clearing');
      sessionUtils.clearSession();
      return null;
    }

    // Validate user data
    if (!parsed.user || !parsed.user.id || !parsed.user.name || !parsed.user.role) {
      console.error('LOG: Invalid session data, clearing');
      sessionUtils.clearSession();
      return null;
    }

    console.log('LOG: Session loaded for user:', parsed.user.name);
    return parsed;
  } catch (error) {
    console.error('LOG: Error loading session:', error);
    sessionUtils.clearSession();
    return null;
  }
};

// Clear user session
const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
    console.log('LOG: Session cleared');
  } catch (error) {
    console.error('LOG: Error clearing session:', error);
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
  if (!user || !user.role) return '/login';
  
  const role = typeof user.role === 'string' ? user.role : 
               (user.role.Doctor !== undefined ? 'Doctor' : 
                user.role.Admin !== undefined ? 'Admin' : 'Patient');
  
  switch (role) {
    case 'Doctor': return '/doctor';
    case 'Admin': return '/admin';
    case 'Patient': return '/patient';
    case 'NGO': return '/ngo';
    default: return '/patient';
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
  updateActivity,
  isSessionValid,
  needsRegistration,
  getRedirectPath,
  debugAuthState,
  normalizeUser,
  normalizeUserRole
};