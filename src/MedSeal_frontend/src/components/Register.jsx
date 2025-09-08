import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConnectWallet } from "@nfid/identitykit/react";
import { useAuth } from '../hooks/useAuth';
import { sessionUtils } from '../utils/session';
import { useFavicon } from './useFavicon';

function Register({ showAlert }) {
  useFavicon('/favicon.png');
  const { isConnected, accounts, identityUser, user_principal, register, loading, user, authenticatedActor, userIndexLoaded, findUserByPrincipal } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    license_number: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionProcessing, setConnectionProcessing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('idle'); // 'idle', 'checking', 'exists', 'registering', 'success', 'failed'
  const [registrationError, setRegistrationError] = useState(null);
  const [adminExists, setAdminExists] = useState(null); // null = checking, true = exists, false = doesn't exist

  // Enhanced debug logging for entire registration process
  console.log("LOG: Register component render - State:", { 
    isConnected, 
    isConnectedType: typeof isConnected,
    hasAccounts: !!accounts && accounts.length > 0,
    accountsLength: accounts?.length || 0,
    user_principal,
    identityUserPresent: !!identityUser,
    formVisible,
    connectionProcessing,
    loading,
    hasUser: !!user,
    adminExists
  });

  // Check if admin exists when component mounts
  useEffect(() => {
    const checkAdminExists = async () => {
      if (authenticatedActor && adminExists === null) {
        try {
          const exists = await authenticatedActor.admin_exists();
          console.log('LOG: Admin exists check result:', exists);
          setAdminExists(exists);
        } catch (error) {
          console.error('LOG: Error checking admin exists:', error);
          setAdminExists(true); // Default to true if check fails
        }
      }
    };
    checkAdminExists();
  }, [authenticatedActor, adminExists]);

  // Process status logging on mount and when wallet connection changes
  useEffect(() => {
    // Wait for a defined isConnected (boolean) and principal initialization
    if (!isConnected) {
      console.log("LOG: Registration Process - Step 1: Connect Wallet");
      console.log("LOG: Display: Create Account → Join MedSeal with your wallet → Step 1: Connect Wallet");
      console.log("LOG: User sees: Connect Your Wallet button");
      setFormVisible(false);
      setConnectionProcessing(false); // Ensure processing is reset
    } else if (isConnected && user_principal) {
      console.log("LOG: Registration Process - Step 2: Wallet Connected Successfully");
      console.log("LOG: Connected wallet principal (normalized):", user_principal);
      console.log("LOG: Should display registration form now");

      if (!formVisible) {
        setConnectionProcessing(true);
        setTimeout(() => {
          setConnectionProcessing(false);
          setFormVisible(true);
          console.log("LOG: Registration form is now visible for user input");
        }, 800); // slightly shorter delay, UI-friendly
      }
    }
  }, [isConnected, formVisible, user_principal]); // Remove accounts and identityUser from dependencies as they're not used in the effect logic

  // Check if user already exists for this wallet
  useEffect(() => {
    if (isConnected && user && !connectionProcessing) {
      console.log('LOG: User already exists for this wallet, redirecting to dashboard');
      console.log('LOG: User data:', user);
      showAlert('info', 'You already have an account. Redirecting to dashboard...');
      
      const redirectPath = sessionUtils.getRedirectPath(user);
      console.log('LOG: Redirecting to:', redirectPath);
      
      // Save session before redirect
      sessionUtils.saveSession(user, 'dashboard');
      
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 1500);
    }
  }, [isConnected, user, showAlert, connectionProcessing]);

  // Add effect to check if wallet already has an account using frontend index
  useEffect(() => {
    const preCheck = async () => {
      if (isConnected && user_principal && userIndexLoaded && registrationStatus === 'idle') {
        const existing = await findUserByPrincipal(user_principal);
        if (existing) {
          console.log('LOG: Frontend index detected existing account, redirecting to login');
          setRegistrationStatus('exists');
          showAlert('info', 'This wallet already has an account. Redirecting to login...');
          setTimeout(() => window.location.href = '/login', 1500);
        }
      }
    };
    preCheck();
  }, [isConnected, user_principal, userIndexLoaded, registrationStatus, findUserByPrincipal, showAlert]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`LOG: Form field changed - ${name}: ${value}`);
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
    // Auto-set license number based on role
    if (name === 'role') {
      if (value === 'Patient') {
        updated.license_number = 'Not Needed';
      } else if (value === 'Doctor' || value === 'NGO') {
        updated.license_number = ''; // Clear it for doctor/NGO to enter manually
      }
    }      return updated;
    });
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    console.log("LOG: Validating registration form...");
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }
    
    if (formData.role === 'Doctor' && !formData.license_number.trim()) {
      newErrors.license_number = 'License number is required for healthcare providers';
    }
    
    if (formData.role === 'NGO' && !formData.license_number.trim()) {
      newErrors.license_number = 'Registration number is required for NGOs';
    }
    
    if (!isConnected) {
      newErrors.wallet = 'Please connect your wallet first';
    }
    
    console.log("LOG: Form validation result:", { 
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors 
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Modify handleSubmit to update registration status
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("LOG: Registration form submitted");
    
    if (!validateForm()) {
      console.log("LOG: Form validation failed");
      showAlert('error', 'Please fix the errors below');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setRegistrationStatus('registering');
      console.log('LOG: Starting registration process with data:', formData);
      
      const result = await register(formData);
      console.log('LOG: Registration result:', result);
      
      if (result.success) {
        console.log('LOG: Registration successful!');
        setRegistrationStatus('success');
        showAlert('success', result.message);
        
        // Save session after successful registration
        if (result.user) {
          console.log('LOG: Registration returned user data:', result.user);
          
          // Make sure user has required fields
          if (!result.user.id || !result.user.name) {
            console.error('LOG: Registration returned incomplete user data', result.user);
            showAlert('error', 'Registration completed but with incomplete data. Please try logging in again.');
            return;
          }
          
          const sessionSaved = sessionUtils.saveSession(result.user, 'dashboard');
          console.log('LOG: Session save result:', sessionSaved);
          
          if (sessionSaved) {
            // Redirect to appropriate dashboard
            const redirectPath = sessionUtils.getRedirectPath(result.user);
            console.log('LOG: Redirecting to dashboard:', redirectPath);
            
            setTimeout(() => {
              window.location.href = redirectPath;
            }, 1500);
          } else {
            console.error('LOG: Failed to save session after registration');
            showAlert('error', 'Failed to save your session. Please try logging in again.');
          }
        } else {
          console.error('LOG: Registration succeeded but no user data returned');
          showAlert('error', 'Registration completed but no user data returned. Please try logging in.');
        }
      } else {
        console.error('LOG: Registration failed:', result.message);
        setRegistrationStatus('failed');
        setRegistrationError(result.message);
        
        // Handle redirect case
        if (result.shouldRedirect === 'login') {
          showAlert('info', result.message);
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          showAlert('error', result.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('LOG: Registration error:', error);
      setRegistrationStatus('failed');
      setRegistrationError(error.message);
      showAlert('error', 'An unexpected error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Info Column */}
          <div className="hidden md:col-span-5 md:flex flex-col justify-center pl-8 space-y-8">
            {/* Replace icon square with favicon */}
            <div className="inline-flex items-center space-x-3 bg-white/15 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
              <img
                src="/favicon.png"
                alt="MedSeal"
                className="w-10 h-10 rounded-lg bg-white ring-1 ring-white/30 object-contain"
                onError={(e)=>{e.currentTarget.style.display='none';}}
              />
              <div>
                <h2 className="text-xl font-bold text-white">MedSeal</h2>
                <p className="text-sm text-blue-200">Join the healthcare revolution</p>
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
                Start your <span className="text-blue-300">secure</span> healthcare journey
              </h1>
              <p className="text-lg text-blue-100 leading-relaxed max-w-md">
                Join thousands of healthcare professionals and patients using blockchain-secured prescriptions with AI-powered assistance.
              </p>
            </div>

            {/* Benefits grid */}
            <div className="space-y-4">
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="w-8 h-8 bg-blue-300 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-shield-halved text-blue-900 text-sm" aria-hidden="true"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Enterprise Security</h3>
                  <p className="text-xs text-blue-200">Immutable records on Internet Computer blockchain</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="w-8 h-8 bg-green-300 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-robot text-green-900 text-sm" aria-hidden="true"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">AI Health Partner</h3>
                  <p className="text-xs text-blue-200">Llama 3.1 powered medication guidance & support</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="w-8 h-8 bg-purple-300 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-eye text-purple-900 text-sm" aria-hidden="true"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">OCR Technology</h3>
                  <p className="text-xs text-blue-200">Automatic digitization of medical documents</p>
                </div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="border-t border-white/20 pt-6">
              <p className="text-xs text-blue-300 mb-3">Trusted by healthcare professionals</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs text-blue-200">HIPAA Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                  <span className="text-xs text-blue-200">SOC 2 Certified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="md:col-span-7">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
              {/* Back to Home */}
              <div className="mb-4">
                <Link
                  to="/"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                  aria-label="Back to home page"
                >
                  <i className="fa-solid fa-arrow-left mr-2" aria-hidden="true"></i>
                  Back to Home
                </Link>
              </div>

              {/* Header with process status */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center space-x-3 mb-4">
                  {/* <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg"> -> replaced */}
                  <img
                    src="/favicon.png"
                    alt="MedSeal"
                    className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 p-2"
                    onError={(e)=>{e.currentTarget.style.display='none';}}
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-sm text-gray-600">Join MedSeal with your wallet</p>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className={`w-8 h-1 ${isConnected ? 'bg-blue-600' : 'bg-blue-200'} rounded-full transition-colors`}></div>
                  <div className={`w-8 h-1 ${formData.name && formData.email ? 'bg-blue-600' : 'bg-blue-200'} rounded-full transition-colors`}></div>
                  <div className={`w-8 h-1 ${formData.role ? 'bg-blue-600' : 'bg-blue-200'} rounded-full transition-colors`}></div>
                </div>
                <p className="text-xs text-gray-500">
                  {!isConnected 
                    ? 'Step 1: Connect Wallet' 
                    : formVisible 
                      ? 'Step 2: Complete Registration' 
                      : 'Processing wallet connection...'}
                </p>
                
                {/* Connection Status Display */}
                {isConnected && accounts && accounts.length > 0 && (
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i className="fa-solid fa-check-circle mr-1" aria-hidden="true"></i>
                    Wallet Connected: {accounts[0]?.principal?.toString()?.slice(0, 6)}...{accounts[0]?.principal?.toString()?.slice(-4)}
                  </div>
                )}
              </div>

              {/* Step 1: Wallet Connection */}
              {!isConnected && (
                <div className="mb-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i className="fa-solid fa-wallet text-blue-600 mr-2" aria-hidden="true"></i>
                    Connect Your Wallet
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    First, connect your wallet to create a secure, decentralized account on MedSeal.
                  </p>
                  
                  <ConnectWallet 
                    connectButtonComponent={(props) => (
                      <button
                        {...props}
                        className="w-full flex justify-center py-3 px-6 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => {
                          console.log("LOG: Connect Wallet button clicked");
                          if (props.onClick) props.onClick();
                        }}
                      >
                        <i className="fa-solid fa-wallet mr-2" aria-hidden="true"></i>
                        Connect Wallet
                      </button>
                    )}
                  />
                  {errors.wallet && <p className="mt-2 text-xs text-red-600">{errors.wallet}</p>}
                </div>
              )}

              {/* Processing Indicator */}
              {connectionProcessing && (
                <div className="mb-6 p-6 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Processing wallet connection...</p>
                  <p className="text-xs text-gray-500 mt-2">Preparing registration form...</p>
                </div>
              )}

              {/* Step 2: Registration Form */}
              {isConnected && !connectionProcessing && formVisible && (
                <>
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center text-sm text-green-800">
                      <i className="fa-solid fa-check-circle mr-2" aria-hidden="true"></i>
                      Wallet connected: { (user_principal || accounts?.[0])?.slice ? (user_principal || accounts?.[0])?.slice(0,8) + '...' + (user_principal || accounts?.[0])?.slice(-8) : (user_principal || accounts?.[0]) }
                    </div>
                    <p className="mt-1 text-xs text-green-700">
                      Please fill out the form below to complete your registration
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6" aria-label="Registration form">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                            }`}
                            placeholder="Enter your full name"
                            disabled={loading}
                          />
                          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                            }`}
                            placeholder="Enter your email"
                            disabled={loading}
                          />
                          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            I am registering as <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, role: 'Doctor'})}
                              className={`p-4 border rounded-lg text-left transition-colors ${
                                formData.role === 'Doctor' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                              }`}
                              disabled={loading}
                            >
                              <div className="font-semibold">👨‍⚕️ Healthcare Provider</div>
                              <div className="text-sm text-gray-600">Create prescriptions and manage patients</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, role: 'Patient'})}
                              className={`p-4 border rounded-lg text-left transition-colors ${
                                formData.role === 'Patient' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                              }`}
                              disabled={loading}
                            >
                              <div className="font-semibold">🤒 Patient</div>
                              <div className="text-sm text-gray-600">Access prescriptions and health guidance</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, role: 'NGO'})}
                              className={`p-4 border rounded-lg text-left transition-colors ${
                                formData.role === 'NGO' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                              }`}
                              disabled={loading}
                            >
                              <div className="font-semibold">🤝 NGO</div>
                              <div className="text-sm text-gray-600">Help patients with contribution campaigns</div>
                            </button>
                            {adminExists === false && (
                              <button
                                type="button"
                                onClick={() => setFormData({...formData, role: 'Admin'})}
                                className={`p-4 border rounded-lg text-left transition-colors ${
                                  formData.role === 'Admin' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                }`}
                                disabled={loading}
                              >
                                <div className="font-semibold">⚙️ System Administrator</div>
                                <div className="text-sm text-gray-600">First time setup - manage platform</div>
                              </button>
                            )}
                          </div>
                          {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
                        </div>

                        {formData.role === 'Doctor' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Medical License Number *</label>
                            <input
                              type="text"
                              name="license_number"
                              value={formData.license_number}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.license_number ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                              }`}
                              placeholder="Enter your medical license number"
                              disabled={loading}
                            />
                            {errors.license_number && <p className="mt-1 text-xs text-red-600">{errors.license_number}</p>}
                          </div>
                        )}

                        {formData.role === 'Patient' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                            <input
                              type="text"
                              name="license_number"
                              value="Not Needed"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                              disabled
                              readOnly
                            />
                            <p className="mt-1 text-xs text-gray-500">Patients do not require a license number</p>
                          </div>
                        )}

                        {formData.role === 'NGO' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">NGO Registration Number *</label>
                            <input
                              type="text"
                              name="license_number"
                              value={formData.license_number}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.license_number ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                              }`}
                              placeholder="Enter your NGO registration/license number"
                              disabled={loading}
                            />
                            {errors.license_number && <p className="mt-1 text-xs text-red-600">{errors.license_number}</p>}
                            <p className="mt-1 text-xs text-gray-500">Please provide your official NGO registration number for verification</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || isSubmitting}
                      className="w-full flex justify-center py-4 px-6 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? 
                        <>
                          <span className="animate-spin inline-block mr-2 w-5 h-5 border-t-2 border-white rounded-full"></span>
                          Creating account...
                        </> : 
                        loading ? 'Please wait...' : 'Create MedSeal Account'
                      }
                    </button>
                  </form>
                </>
              )}

              {/* Debug Information (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                  <p><strong>Debug Info:</strong></p>
                  <p>Connected: {String(isConnected)} (type: {typeof isConnected})</p>
                  <p>Processing: {String(connectionProcessing)}</p>
                  <p>Form Visible: {String(formVisible)}</p>
                  <p>Accounts: {accounts?.length || 0}</p>
                  <p>User Exists: {String(!!user)}</p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 hover:text-blue-500">
                    Connect wallet to sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;