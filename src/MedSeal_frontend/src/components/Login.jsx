import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ConnectWallet } from "@nfid/identitykit/react";
import { useAuth } from '../hooks/useAuth';
import { sessionUtils } from '../utils/session';

function Login({ showAlert }) {
  const { isConnected, user, loading, accounts } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Enhanced debug logging
  console.log("LOG: Login component state:", { 
    isConnected, 
    isConnectedType: typeof isConnected,
    hasUser: !!user, 
    loading,
    redirecting,
    connectionChecked,
    hasAccounts: !!accounts && accounts.length > 0,
    accountsCount: accounts?.length || 0
  });

  // Debug logging for process
  useEffect(() => {
    console.log("LOG: Login process started. Awaiting wallet connection and user account status.");
  }, []);

  // Function to check if the current wallet has a user account
  const checkWalletAccount = useCallback(async () => {
    if (isConnected && !user && !loading && !redirecting) {
      console.log('LOG: Connected wallet has no account, redirecting to registration');
      setRedirecting(true);
      showAlert('info', 'No account found for this wallet. Redirecting to registration...');
      setTimeout(() => {
        window.location.href = '/register';
      }, 2000);
    }
  }, [isConnected, user, loading, redirecting, showAlert]);

  // Handle wallet connection status changes
  useEffect(() => {
    // Process when connection state is defined
    if (typeof isConnected === 'boolean') {
      console.log('LOG: Connection state is defined:', isConnected);
      const timer = setTimeout(() => {
        setConnectionChecked(true);
        checkWalletAccount();
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      console.log('LOG: Connection state is still undefined, waiting...');
    }
  }, [isConnected, checkWalletAccount]);

  // Redirect if user is authenticated
  useEffect(() => {
    if (isConnected && user && connectionChecked) {
      // Make sure user has the required fields
      if (user.id && user.name) {
        console.log('LOG: User authenticated, redirecting...', user);
        setRedirecting(true);
        
        const redirectPath = sessionUtils.getRedirectPath(user);
        
        // Save session before redirect
        sessionUtils.saveSession(user, 'dashboard');
        
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 1000);
      } else {
        console.error('LOG: User data is incomplete', user);
        setErrorMsg('User data is incomplete. Please try again or register a new account.');
        showAlert('error', 'User data is incomplete. Please try again or register a new account.');
      }
    }
  }, [isConnected, user, connectionChecked, showAlert]);

  // Separate effect for wallet connection without user
  useEffect(() => {
    if (isConnected && !user && !loading && !redirecting && connectionChecked) {
      console.log("LOG: Connected wallet has no account. Will redirect to registration.");
      setRedirecting(true);
      showAlert('info', 'No account found for this wallet. Redirecting to registration...');
      setTimeout(() => {
        window.location.href = '/register';
      }, 2000);
    }
  }, [isConnected, user, loading, redirecting, connectionChecked, showAlert]);

  useEffect(() => {
    if (isConnected && user && connectionChecked) {
      console.log("LOG: User detected for connected wallet. Redirecting to dashboard.");
    }
  }, [isConnected, user, connectionChecked]);

  // Show loading or redirecting state
  if (loading || redirecting || (isConnected && !connectionChecked)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {redirecting 
                ? 'Redirecting...'
                : loading 
                  ? 'Checking your account...' 
                  : 'Processing wallet connection...'}
            </p>
            {isConnected && accounts && accounts.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">Connected wallet: {accounts[0]?.principal?.toString()?.slice(0, 8)}...{accounts[0]?.principal?.toString()?.slice(-8)}</p>
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
                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center text-sm text-red-800">
                    <i className="fa-solid fa-exclamation-circle mr-2" aria-hidden="true"></i>
                    {errorMsg}
                  </div>
                </div>
              )}

              {/* Wallet Connection Status */}
              {isConnected && accounts && accounts.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center text-sm text-blue-800">
                    <i className="fa-solid fa-check-circle mr-2" aria-hidden="true"></i>
                    Wallet connected: {accounts[0]?.principal?.toString()?.slice(0, 8)}...{accounts[0]?.principal?.toString()?.slice(-8)}
                  </div>
                  <p className="mt-2 text-xs text-blue-600">
                    Checking for account... If you don't have an account yet, you'll be redirected to register.
                  </p>
                  {console.log("LOG: Wallet connected with principal:", accounts[0]?.principal?.toString())}
                </div>
              )}

              {/* Connection State Debug (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                  <p><strong>Debug - Connection State:</strong></p>
                  <p>isConnected: {String(isConnected)} (type: {typeof isConnected})</p>
                  <p>connectionChecked: {String(connectionChecked)}</p>
                  <p>hasAccounts: {String(!!accounts && accounts.length > 0)}</p>
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
                        className="w-full flex justify-center py-3 px-6 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={isConnected}
                        onClick={() => {
                          console.log("LOG: Connect Wallet button clicked");
                          if (props.onClick) props.onClick();
                        }}
                      >
                        <i className="fa-solid fa-wallet mr-2" aria-hidden="true"></i>
                        {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
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