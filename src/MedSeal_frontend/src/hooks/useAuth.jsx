import { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAgent, useIdentityKit } from "@nfid/identitykit/react";
import { Actor } from "@dfinity/agent";
import { sessionUtils } from '../utils/session';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

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

  // Debug identity kit connection state
  useEffect(() => {
    console.log('LOG: Identity Kit Raw State:', { 
      isInitializing,
      isConnected,
      identityUser: !!identityUser,
      isUserConnecting,
      hasAccounts: !!accounts && accounts.length > 0, 
      accountsCount: accounts?.length || 0,
      hasAgent: !!authenticatedAgent,
      user_principal
    });
    
    // Debug auth info when connection state changes
    if (initialized) {
      sessionUtils.debugAuthState(isConnected, user, loading);
    }
  }, [isInitializing, isConnected, identityUser, isUserConnecting, accounts, authenticatedAgent, user, loading, initialized, user_principal]);

  // Create authenticated actor
  const authenticatedActor = useMemo(() => {
    if (!authenticatedAgent) return null;
    
    // Use the actual backend canister instead of a mock
    return MedSeal_backend;
  }, [authenticatedAgent]);

  // Initial load - check for existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = sessionUtils.loadSession();
        if (session && session.user) {
          console.log('LOG: Found existing session for user:', session.user.name);
          setUser(session.user);
        } else {
          console.log('LOG: No valid session found');
        }
      } catch (error) {
        console.error('LOG: Error checking session:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };
    
    // Wait for IdentityKit to initialize
    if (!isInitializing) {
      checkSession();
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
        principal: identityUser?.principal?.toString()
      });
      
      // Use principal/identityUser presence instead of raw accounts length
      if (isConnected && principal && authenticatedActor && !isUserConnecting) {
        console.log('LOG: Wallet is connected (principal available), checking for existing user...');
        await checkExistingUser();
      } else if (!isConnected && !isInitializing) {
        console.log('LOG: Wallet disconnected, clearing user state');
        setUser(null);
        sessionUtils.clearSession();
        setLoading(false);
      }
    };
    
    if (initialized && !isInitializing) {
      handleConnectionChange();
    }
  }, [isConnected, identityUser, accounts, authenticatedActor, initialized, isInitializing, isUserConnecting]);

  const checkExistingUser = async () => {
    if (!authenticatedActor || !identityUser) return;
    
    setLoading(true);
    try {
      // Use the principal from identityUser
      const principal = identityUser.principal.toString();
      console.log('LOG: Checking for existing user with principal:', principal);
      
      const result = await authenticatedActor.get_user_by_principal(principal);
      console.log('LOG: User lookup result:', result);
      
      if ('Ok' in result) {
        const userData = result.Ok;
        console.log('LOG: User found:', userData);
        setUser(userData);
        
        // Save user data in session
        sessionUtils.saveSession(userData);
      } else {
        // User doesn't exist, need registration
        console.log('LOG: User not found, needs registration');
        setUser(null);
        sessionUtils.clearSession();
      }
    } catch (error) {
      console.error('LOG: Error checking existing user:', error);
      setUser(null);
      sessionUtils.clearSession();
    } finally {
      setLoading(false);
    }
  };

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
      
      // Normalize role format for backend - use string instead of variant
      const roleString = userData.role === 'Doctor' ? 'Doctor' : 'Patient';
      
      // Try the simple registration first (this should work since it uses ic_cdk::caller())
      try {
        console.log('LOG: Attempting simple registration...');
        const result = await authenticatedActor.register_user_simple(
          userData.name,
          userData.email,
          { [roleString]: null }, // Use variant format
          userData.license_number || ""
        );
        
        console.log('LOG: Simple registration result:', result);
        
        if ('Ok' in result) {
          const newUser = result.Ok;
          console.log('LOG: Registration successful, user created:', newUser);
          
          setUser(newUser);
          
          return { 
            success: true, 
            message: `Registration successful! Welcome to MedSeal, ${newUser.name}!`,
            user: newUser
          };
        } else {
          console.error('LOG: Simple registration failed:', result.Err);
          throw new Error(result.Err);
        }
      } catch (simpleError) {
        console.log('LOG: Simple registration failed, error:', simpleError);
        
        // If simple registration fails, return the error instead of trying the complex method
        // The principal mismatch suggests an authentication issue rather than a method issue
        let errorMessage = 'Registration failed. Please try again.';
        
        if (simpleError.message) {
          if (simpleError.message.includes('already registered')) {
            errorMessage = 'This email is already registered. Please use a different email or try logging in.';
          } else if (simpleError.message.includes('already has an account')) {
            errorMessage = 'This wallet already has an account. Please try logging in instead.';
          } else if (simpleError.message.includes('License number is required')) {
            errorMessage = 'License number is required for healthcare providers.';
          } else {
            errorMessage = simpleError.message;
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
          errorMessage = 'This wallet already has an account. Please try logging in instead.';
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
      await disconnect();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('LOG: Logout error:', error);
      // Still clear the session even if disconnect fails
      sessionUtils.clearSession();
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  const value = {
    user,
    loading: loading || isInitializing || isUserConnecting,
    isConnected,
    accounts: normalizedAccounts,
    identityUser,
    user_principal, // expose user_principal instead of `principal`
    connectWallet,
    register,
    logout,
    authenticatedActor
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};