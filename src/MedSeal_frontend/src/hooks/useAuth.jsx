import { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAgent, useIdentityKit } from "@nfid/identitykit/react";
import { Actor } from "@dfinity/agent";
import { idlFactory as MedSealBackendIdlFactory } from 'declarations/MedSeal_backend'; // Ensure correct import
import { sessionUtils } from '../utils/session';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [userCheckPerformed, setUserCheckPerformed] = useState(false);
  const [userPrincipalIndex, setUserPrincipalIndex] = useState(null);
  const [userIndexLoaded, setUserIndexLoaded] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // NFID Identity Kit hooks - using correct properties
  const { 
    isInitializing,
    user: identityUser,
    isUserConnecting,
    accounts,
    connect,
    disconnect
  } = useIdentityKit();
  const authenticatedAgent = useAgent();

  // Derive isConnected from identityUser instead of using non-existent isConnected
  const isConnected = !!identityUser;

  // normalize principal (string) from identityUser or accounts
  const user_principal = identityUser?.principal?.toString() ||
                    (accounts && accounts.length > 0
                      ? (accounts[0]?.principal ? accounts[0].principal.toString() : String(accounts[0]))
                      : undefined);

  // expose a simpler accounts array of principal strings (if available)
  const normalizedAccounts = (accounts && accounts.length > 0)
    ? accounts.map(acc => (acc?.principal ? acc.principal.toString() : String(acc)))
    : (user_principal ? [user_principal] : undefined);

  // Ensure the backend canister ID is retrieved correctly
  const backendCanisterId = process.env.CANISTER_ID_MEDSEAL_BACKEND || 
                            import.meta.env.VITE_CANISTER_ID_MEDSEAL_BACKEND || 
                            'oqjvn-fqaaa-aaaab-qab5q-cai'; // Fallback for development

  // Create authenticated actor
  const authenticatedActor = useMemo(() => {
    if (!authenticatedAgent) return null;

    if (!backendCanisterId) {
      console.error('LOG: Backend Canister ID is undefined. Ensure it is set in the environment variables.');
      return null;
    }

    // Ensure the actor is created with the authenticated agent and valid canister ID
    return Actor.createActor(MedSealBackendIdlFactory, {
      agent: authenticatedAgent,
      canisterId: backendCanisterId,
    });
  }, [authenticatedAgent, backendCanisterId]);

  // Load principal index once after actor & connection ready
  useEffect(() => {
    const loadIndex = async () => {
      if (!authenticatedActor || !isConnected || userIndexLoaded || loadingIndex) return;
      try {
        setLoadingIndex(true);
        console.log('LOG: Loading user principal index from backend...');
        const principalEntries = await authenticatedActor.list_user_principals();
        const map = {};
        (principalEntries || []).forEach(entry => {
          // Expect PrincipalEntry record { principal_ent, user_id, email }
          const principal = (entry.principal_ent || '').trim().toLowerCase();
          map[principal] = { user_id: entry.user_id, email: entry.email };
        });
        console.log('LOG: User principal index loaded. Count:', Object.keys(map).length);
        setUserPrincipalIndex(map);
        setUserIndexLoaded(true);
      } catch (e) {
        console.error('LOG: Failed to load user principal index:', e);
      } finally {
        setLoadingIndex(false);
      }
    };
    loadIndex();
  }, [authenticatedActor, isConnected, userIndexLoaded, loadingIndex]);

  const findUserByPrincipal = async (principalRaw) => {
    if (!principalRaw || !authenticatedActor || !userPrincipalIndex) return null;
    const normalized = principalRaw.trim().toLowerCase();
    const entry = userPrincipalIndex[normalized];
    if (!entry) return null;
    try {
      const full = await authenticatedActor.get_user(entry.user_id);
      console.log('LOG: Raw user from backend:', full);
      
      // Handle case where backend returns an array instead of a single object
      let userObject = full;
      if (Array.isArray(full) && full.length > 0) {
        console.log('LOG: Backend returned array, taking first element');
        userObject = full[0];
      }
      
      if (userObject) {
        // Validate the user object has required fields
        if (!userObject.name || !userObject.email || (userObject.role === undefined || userObject.role === null)) {
          console.error('LOG: User object missing required fields:', {
            hasName: !!userObject.name,
            hasEmail: !!userObject.email,
            hasRole: userObject.role !== undefined && userObject.role !== null,
            role: userObject.role,
            fullObject: userObject
          });
          return null;
        }
        
        // Use sessionUtils to normalize the user object
        const normalizedUser = sessionUtils.normalizeUser(userObject);
        console.log('LOG: User found and normalized:', normalizedUser);
        
        // Final validation after normalization
        if (!normalizedUser.role) {
          console.error('LOG: User role is still undefined after normalization');
          return null;
        }
        
        return normalizedUser;
      }
    } catch (e) {
      console.error('LOG: get_user failed for user_id', entry.user_id, e);
    }
    return null;
  };

  // Initial load - check for existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true); // Ensure loading is set to true at start
        const session = sessionUtils.loadSession();
        if (session && session.user) {
          console.log('LOG: Found existing session for user:', session.user.name);
          
          // Extra validation for session user
          if (!session.user.role) {
            console.error('LOG: Session user missing role, clearing session');
            sessionUtils.clearSession();
            setUser(null);
          } else {
            console.log('LOG: Session user role:', session.user.role);
            setUser(session.user);
            setUserCheckPerformed(true);
          }
        } else {
          console.log('LOG: No valid session found');
        }
      } catch (error) {
        console.error('LOG: Error checking session:', error);
        sessionUtils.clearSession();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };
    
    if (!isInitializing) {
      checkSession();
    } else {
      // If still initializing, ensure loading is true
      setLoading(true);
    }
  }, [isInitializing]);

  // Check for existing user when wallet connects
  useEffect(() => {
    const handleConnectionChange = async () => {
      console.log('LOG: Connection status changed:', { 
        isConnected,
        isInitializing,
        isUserConnecting,
        hasAccounts: accounts?.length > 0,
        hasIdentityUser: !!identityUser,
        principal: identityUser?.principal?.toString(),
        userCheckPerformed,
        hasUser: !!user
      });
      
      // Only check for user if:
      // 1. Wallet is connected
      // 2. We have a principal
      // 3. We have the authenticated actor
      // 4. Not currently connecting
      // 5. Haven't already found a user (either from session or previous check)
      // 6. Haven't performed this check already
      if (isConnected && user_principal && authenticatedActor && !isUserConnecting && !user && !userCheckPerformed) {
        console.log('LOG: Wallet is connected, no user found in session, checking backend...');
        setUserCheckPerformed(true);
        setLoading(true);
        checkExistingUser();
      } else if (!isConnected && !isInitializing) {
        console.log('LOG: Wallet disconnected, clearing user state');
        setUser(null);
        setUserCheckPerformed(false);
        sessionUtils.clearSession();
        setLoading(false);
      }
    };
    
    if (initialized && !isInitializing) {
      handleConnectionChange();
    }
  }, [isConnected, identityUser, accounts, authenticatedActor, initialized, isInitializing, isUserConnecting, user_principal, user, userCheckPerformed]);

  // Adjust existing user check to rely on local index
  const checkExistingUser = async () => {
    if (!identityUser || !userPrincipalIndex) {
      setLoading(false);
      return;
    }
    const principal = identityUser.principal.toString().trim().toLowerCase();
    console.log('LOG: Frontend principal lookup:', principal);
    try {
      const existing = await findUserByPrincipal(principal);
      if (existing) {
        console.log('LOG: Found existing user via frontend index:', existing);
        setUser(existing);
        sessionUtils.saveSession(existing);
      } else {
        console.log('LOG: No user found in index for principal');
        setUser(null);
      }
    } catch (e) {
      console.error('LOG: Error during frontend principal lookup:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Trigger user lookup when index + connection ready
  useEffect(() => {
    if (isConnected && user_principal && authenticatedActor && userPrincipalIndex && !user && !userCheckPerformed) {
      setUserCheckPerformed(true);
      setLoading(true);
      checkExistingUser();
    }
  }, [isConnected, user_principal, authenticatedActor, userPrincipalIndex, user, userCheckPerformed]);

  // Clear user on disconnect
  useEffect(() => {
    if (!isConnected && !isInitializing) {
      console.log('LOG: Wallet disconnected, clearing user state');
      setUser(null);
      setUserCheckPerformed(false);
      sessionUtils.clearSession();
      setLoading(false);
    }
  }, [isConnected, isInitializing]);

  const connectWallet = async () => {
    if (isInitializing) {
      throw new Error("Identitykit is not initialized yet");
    }
    
    setLoading(true);
    try {
      console.log('LOG: Connecting wallet...');
      await connect();
      console.log('LOG: Connect function called, waiting for connection status to update');
      return { success: true, message: 'Wallet connected successfully!' };
    } catch (error) {
      console.error('LOG: Wallet connection error:', error);
      return { success: false, message: 'Failed to connect wallet: ' + error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    if (!authenticatedActor) {
      return { success: false, message: 'Backend connection not available' };
    }

    // Require a connected identity/principal
    if (!isConnected || !identityUser || !user_principal) {
      return { success: false, message: 'Please connect your wallet first' };
    }

    setLoading(true);
    try {
      console.log('LOG: Registering with data:', userData);
      console.log('LOG: Using user_principal from auth hook:', user_principal);
      console.log('LOG: IdentityUser principal:', identityUser.principal.toString());
      
      // Clear any existing session before registration
      sessionUtils.clearSession();
      setUser(null);
      setUserCheckPerformed(false); // Reset check flag
      
      // Check if principal already has account using frontend index first
      if (userPrincipalIndex && userPrincipalIndex[user_principal.trim().toLowerCase()]) {
        console.log('LOG: Frontend index shows principal already has account');
        return { 
          success: false, 
          message: 'This wallet already has an account. Redirecting to login...',
          shouldRedirect: 'login'
        };
      }
      
      // Normalize role format for backend - handle Doctor, Admin, Patient, NGO
      let roleString = 'Patient';
      if (userData.role === 'Doctor') roleString = 'Doctor';
      else if (userData.role === 'Admin') roleString = 'Admin';
      else if (userData.role === 'NGO') roleString = 'NGO';
      
      // Use register_user_with_principal for explicit principal handling
      try {
        console.log('LOG: Attempting registration with principal...');
        const result = await authenticatedActor.register_user_with_principal({
          name: userData.name,
          email: userData.email,
          role: { [roleString]: null }, // Use variant format including Admin support
          license_number: userData.license_number || "",
          user_principal: user_principal.trim().toLowerCase()
        });
        
        console.log('LOG: Registration with principal result:', result);
        
        if ('Ok' in result) {
          const newUser = result.Ok;
          console.log('LOG: Registration successful, user created:', newUser);
          
          // Use sessionUtils to normalize the user object
          const serializedUser = sessionUtils.normalizeUser(newUser);
          
          // Update the frontend index with the new user
          if (userPrincipalIndex) {
            setUserPrincipalIndex(prev => ({
              ...prev,
              [user_principal.trim().toLowerCase()]: {
                user_id: serializedUser.id,
                email: serializedUser.email
              }
            }));
          }
          
          setUser(serializedUser);
          setUserCheckPerformed(true);
          
          return { 
            success: true, 
            message: `Registration successful! Welcome to MedSeal, ${serializedUser.name}!`,
            user: serializedUser
          };
        } else {
          console.error('LOG: Registration with principal failed:', result.Err);
          
          // Handle specific backend error cases
          if (result.Err.includes('already has an account')) {
            return { 
              success: false, 
              message: 'This wallet already has an account. Redirecting to login...',
              shouldRedirect: 'login'
            };
          } else if (result.Err.includes('already registered')) {
            return { 
              success: false, 
              message: 'This email is already registered. Please use a different email or try logging in.'
            };
          } else {
            throw new Error(result.Err);
          }
        }
      } catch (registrationError) {
        console.log('LOG: Registration with principal failed, error:', registrationError);
        
        let errorMessage = 'Registration failed. Please try again.';
        
        if (registrationError.message) {
          if (registrationError.message.includes('already registered')) {
            errorMessage = 'This email is already registered. Please use a different email or try logging in.';
          } else if (registrationError.message.includes('already has an account')) {
            errorMessage = 'This wallet already has an account. Redirecting to login...';
            return { 
              success: false, 
              message: errorMessage,
              shouldRedirect: 'login'
            };
          } else if (registrationError.message.includes('License number is required')) {
            errorMessage = 'License number is required for healthcare providers.';
          } else if (registrationError.message.includes('Principal mismatch')) {
            errorMessage = 'Authentication error. Please disconnect and reconnect your wallet, then try again.';
          } else {
            errorMessage = registrationError.message;
          }
        }
        
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('LOG: Registration error:', error);
      
      // Handle specific error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('not a function')) {
          errorMessage = 'Backend function not available. Please refresh and try again.';
        } else if (error.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please use a different email or try logging in.';
        } else if (error.message.includes('already has an account')) {
          errorMessage = 'This wallet already has an account. Redirecting to login...';
          return { 
            success: false, 
            message: errorMessage,
            shouldRedirect: 'login'
          };
        } else if (error.message.includes('Principal mismatch')) {
          errorMessage = 'Authentication error. Please disconnect and reconnect your wallet, then try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      sessionUtils.clearSession();
      setUser(null);
      setUserCheckPerformed(false); // Reset check flag
      await disconnect();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('LOG: Logout error:', error);
      // Still clear the session even if disconnect fails
      sessionUtils.clearSession();
      setUser(null);
      setUserCheckPerformed(false);
      navigate('/login', { replace: true });
    }
  };

  const normalizeUserRole = (role) => {
    console.log('LOG: Normalizing role:', role, 'Type:', typeof role);

    if (role === undefined || role === null) {
      console.warn('LOG: Role is undefined/null, defaulting to Patient');
      return 'Patient';
    }

    if (typeof role === 'string') {
      console.log('LOG: Role is already a string:', role);
      return role;
    }

    if (typeof role === 'object' && role !== null) {
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
      if (role.hasOwnProperty('NGO')) {
        console.log('LOG: Found NGO role in object format');
        return 'NGO';
      }

      if (role.role) {
        console.log('LOG: Found nested role, recursing');
        return normalizeUserRole(role.role);
      }

      console.warn('LOG: Role object exists but has no Doctor/Patient/NGO properties:', Object.keys(role));
    }

    console.warn('LOG: Unknown role format, defaulting to Patient. Role was:', role);
    return 'Patient';
  };

  const value = {
    user,
    loading: Boolean(loading || isInitializing || isUserConnecting || loadingIndex), // Ensure boolean value
    isConnected,
    accounts: normalizedAccounts,
    identityUser,
    user_principal,
    connectWallet,
    register,
    logout,
    authenticatedActor,
    userIndexLoaded,
    findUserByPrincipal
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};