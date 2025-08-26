import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ConnectWallet } from "@nfid/identitykit/react";
import { useAuth } from '../hooks/useAuth';
import { sessionUtils } from '../utils/session';

function Login({ showAlert }) {
  const { isConnected, user, loading, user_principal, authenticatedActor, userIndexLoaded, findUserByPrincipal } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [userCheckCompleted, setUserCheckCompleted] = useState(false);
  const [redirectExecuted, setRedirectExecuted] = useState(false);
  const [accountCheckFailed, setAccountCheckFailed] = useState(false);
  const [awaitingIndexResolve, setAwaitingIndexResolve] = useState(false);

  // Enhanced debug logging
  console.log("LOG: Login component state:", { 
    isConnected, 
    hasUser: !!user, 
    loading,
    redirecting,
    userCheckCompleted,
    user_principal
  });

  // Debug logging for process
  useEffect(() => {
    console.log("LOG: Login process started. Awaiting wallet connection and user account status.");
    setDebugInfo('Login process started...');
  }, []);

  // Handle wallet connection status changes
  useEffect(() => {
    if (typeof isConnected === 'boolean') {
      console.log('LOG: Connection state is defined:', isConnected);
      setDebugInfo(`Connection state: ${isConnected ? 'Connected' : 'Disconnected'}`);
      
      if (isConnected && user_principal) {
        setDebugInfo(`Wallet connected: ${user_principal.slice(0, 8)}...${user_principal.slice(-8)}`);
      } else if (!isConnected) {
        setUserCheckCompleted(false);
        setDebugInfo('Waiting for wallet connection...');
      }
    }
  }, [isConnected, user_principal]);

  // Handle user authentication flow after connection is established
  useEffect(() => {
    if (isConnected && !userCheckCompleted && !loading && !redirectExecuted) {
      console.log('LOG: Running user check after connection established');
      console.log('LOG: Current auth state:', {
        isConnected,
        userCheckCompleted,
        loading,
        redirectExecuted,
        user: !!user,
        user_principal
      });
      
      setUserCheckCompleted(true);
      
      if (user && user.id && user.name) {
        console.log('LOG: User found, redirecting to dashboard...', user);
        setDebugInfo(`Welcome back ${user.name}! Redirecting...`);
        setRedirecting(true);
        setRedirectExecuted(true);
        
        const redirectPath = sessionUtils.getRedirectPath(user);
        sessionUtils.saveSession(user, 'dashboard');
        
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 1000);
      } else {
        console.log('LOG: No user found after connection check - wallet has no account');
        console.log('LOG: User principal:', user_principal);
        console.log('LOG: This suggests the principal lookup failed in the backend');
        
        setDebugInfo(`No account found for wallet: ${user_principal.slice(0, 8)}...${user_principal.slice(-8)}`);
        setAccountCheckFailed(true);
        setErrorMsg(`No MedSeal account found for this wallet. Please create an account first or connect a different wallet.`);
        showAlert('warning', 'This wallet does not have a MedSeal account. Please create an account first.');
      }
    }
  }, [isConnected, user, loading, userCheckCompleted, user_principal, showAlert, redirectExecuted]);

  // When index ready & connected & no user yet, attempt frontend resolution
  useEffect(() => {
    const resolveUser = async () => {
      if (isConnected && user_principal && userIndexLoaded && !user && !userCheckCompleted && !redirectExecuted) {
        console.log('LOG: Attempting frontend index auth');
        setAwaitingIndexResolve(true);
        const found = await findUserByPrincipal(user_principal);
        setAwaitingIndexResolve(false);
        setUserCheckCompleted(true);
        if (found) {
          console.log('LOG: Frontend index resolved user, redirecting');
          console.log('LOG: User role before saving:', found.role);
          
          // Ensure the user object is properly serialized before saving
          const saveResult = sessionUtils.saveSession(found);
          if (!saveResult) {
            console.error('LOG: Failed to save session, user object might be invalid:', found);
            setErrorMsg('Failed to save your session. Please try again.');
            return;
          }
          
          setRedirecting(true);
          setRedirectExecuted(true);
          const redirectPath = sessionUtils.getRedirectPath(found);
          console.log('LOG: Redirecting to:', redirectPath);
          setTimeout(() => window.location.href = redirectPath, 600);
        } else {
          console.log('LOG: No account via index; marking accountCheckFailed');
          setAccountCheckFailed(true);
          setErrorMsg('No MedSeal account found for this wallet. Please create an account first.');
          showAlert('warning', 'This wallet does not have a MedSeal account.');
        }
      }
    };
    resolveUser();
  }, [isConnected, user_principal, userIndexLoaded, user, userCheckCompleted, redirectExecuted, findUserByPrincipal, showAlert]);

  // Early redirect if user is already authenticated from session
  useEffect(() => {
    if (user && user.id && user.name && !redirecting && !redirectExecuted) {
      console.log('LOG: User already authenticated from session, redirecting immediately');
      setRedirecting(true);
      setRedirectExecuted(true);
      const redirectPath = sessionUtils.getRedirectPath(user);
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 500);
    }
  }, [user, redirecting, redirectExecuted]);

  // Show loading or redirecting state
  if (loading || redirecting || awaitingIndexResolve) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">
              {redirecting 
                ? 'Redirecting...'
                : awaitingIndexResolve 
                  ? 'Authenticating...'
                  : loading 
                    ? 'Loading...' 
                    : 'Processing...'}
            </p>
            <p className="text-xs text-gray-500">{debugInfo}</p>
            {isConnected && user_principal && (
              <p className="mt-2 text-xs text-gray-500">
                Connected: {user_principal.slice(0, 8)}...{user_principal.slice(-8)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left info column */}
          <div className="hidden md:col-span-5 md:flex flex-col justify-center pl-8 space-y-6">
            <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
              <div className="w-9 h-9 bg-white rounded-md flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">MedSeal</h2>
                <p className="text-xs text-blue-200">Secure healthcare platform</p>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-white leading-tight">Welcome back</h1>
            <p className="text-blue-100 max-w-sm">
              Connect your wallet to access your prescriptions, AI support and secure healthcare workflows — protected by blockchain.
            </p>

            <div className="space-y-3">
              <div className="inline-flex items-center space-x-3 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                <i className="fa-solid fa-wallet text-white/90" aria-hidden="true"></i>
                <div>
                  <div className="text-sm font-semibold text-white">Wallet Authentication</div>
                  <div className="text-xs text-blue-200">Secure & decentralized access</div>
                </div>
              </div>
              <div className="inline-flex items-center space-x-3 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                <i className="fa-solid fa-robot text-white/90" aria-hidden="true"></i>
                <div>
                  <div className="text-sm font-semibold text-white">AI Assistance</div>
                  <div className="text-xs text-blue-200">Context-aware medication guidance</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form card */}
          <div className="md:col-span-7">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              {/* Logo */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">MedSeal</h1>
                    <p className="text-sm text-gray-600">Connect your wallet to continue</p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start text-sm text-red-800">
                    <i className="fa-solid fa-exclamation-circle mr-2 mt-0.5" aria-hidden="true"></i>
                    <div>
                      <p className="font-medium">{errorMsg}</p>
                      {accountCheckFailed && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-red-700">
                            If you don't have an account yet, you can create one:
                          </p>
                          <Link
                            to="/register"
                            className="inline-flex items-center px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <i className="fa-solid fa-user-plus mr-1" aria-hidden="true"></i>
                            Create Account
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Connection Status */}
              {isConnected && user_principal && !accountCheckFailed && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center text-sm text-blue-800">
                    <i className="fa-solid fa-check-circle mr-2" aria-hidden="true"></i>
                    Wallet connected: {user_principal.slice(0, 8)}...{user_principal.slice(-8)}
                  </div>
                  <p className="mt-2 text-xs text-blue-600">
                    {debugInfo || 'Checking for account...'}
                  </p>
                </div>
              )}

              {/* Account Check Failed Status */}
              {isConnected && user_principal && accountCheckFailed && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center text-sm text-yellow-800">
                    <i className="fa-solid fa-exclamation-triangle mr-2" aria-hidden="true"></i>
                    Wallet connected but no account found
                  </div>
                  <p className="mt-2 text-xs text-yellow-700">
                    Connected wallet: {user_principal.slice(0, 8)}...{user_principal.slice(-8)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setAccountCheckFailed(false);
                        setErrorMsg(null);
                        setUserCheckCompleted(false);
                        // This will trigger a disconnect and allow connecting a different wallet
                        window.location.reload();
                      }}
                      className="text-xs text-yellow-700 hover:text-yellow-800 underline"
                    >
                      Try Different Wallet
                    </button>
                  </div>
                </div>
              )}

              {/* Enhanced Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                  <p><strong>Debug - Login State:</strong></p>
                  <p>isConnected: {String(isConnected)}</p>
                  <p>userCheckCompleted: {String(userCheckCompleted)}</p>
                  <p>accountCheckFailed: {String(accountCheckFailed)}</p>
                  <p>hasUser: {String(!!user)}</p>
                  <p>loading: {String(loading)}</p>
                  <p>user_principal: {user_principal || 'undefined'}</p>
                  <p>debugInfo: {debugInfo}</p>
                  {user && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p><strong>User Found:</strong></p>
                      <p>Name: {user.name}</p>
                      <p>Email: {user.email}</p>
                      <p>Role: {JSON.stringify(user.role)}</p>
                      <p>ID: {user.id}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Wallet Connection */}
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Use your wallet to securely access MedSeal. No passwords required.
                  </p>
                </div>

                <div className="flex justify-center">
                  <ConnectWallet 
                    connectButtonComponent={(props) => (
                      <button
                        {...props}
                        className="w-full flex justify-center py-3 px-6 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isConnected && !accountCheckFailed}
                        onClick={() => {
                          console.log("LOG: Connect Wallet button clicked");
                          if (accountCheckFailed) {
                            // Reset state for new connection attempt
                            setAccountCheckFailed(false);
                            setErrorMsg(null);
                            setUserCheckCompleted(false);
                            setRedirectExecuted(false);
                          }
                          if (props.onClick) props.onClick();
                        }}
                      >
                        <i className="fa-solid fa-wallet mr-2" aria-hidden="true"></i>
                        {isConnected && !accountCheckFailed 
                          ? 'Wallet Connected' 
                          : accountCheckFailed 
                            ? 'Connect Different Wallet'
                            : 'Connect Wallet'
                        }
                      </button>
                    )}
                  />
                </div>

                <div className="text-center text-xs text-gray-500">
                  <p>Supported wallets: NFID, Internet Identity, Plug, and more</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">New to MedSeal?</span>
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    to="/register"
                    className="w-full inline-flex justify-center py-2 px-4 rounded-lg border border-blue-600 text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create account
                  </Link>
                </div>
              </div>

              {/* Trust badges */}
              <div className="text-center mt-6">
                <div className="flex justify-center space-x-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">🔒 HIPAA Compliant</span>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">⛓️ Blockchain Secured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;