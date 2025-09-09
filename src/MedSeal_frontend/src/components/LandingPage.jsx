import React, { memo, useState, useCallback, useEffect } from 'react';
import { useFavicon } from './useFavicon';

const LandingPage = ({ onLogin, onRegister }) => {
  useFavicon('/favicon.png');
  const [activeTab, setActiveTab] = useState('doctors');

  // mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // PWA installation states
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPWABanner, setShowPWABanner] = useState(true);

  // Add safe handlers so clicks work even if props are not provided
  const handleLogin = useCallback(() => {
    if (typeof onLogin === 'function') {
      onLogin();
    } else {
      window.location.href = '/login';
    }
  }, [onLogin]);

  const handleRegister = useCallback(() => {
    if (typeof onRegister === 'function') {
      onRegister();
    } else {
      window.location.href = '/register';
    }
  }, [onRegister]);

  // PWA installation handling
  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsAppInstalled(true);
        setShowPWABanner(false);
      }
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setShowPWABanner(false);
      setDeferredPrompt(null);
    };

    checkIfInstalled();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // close mobile menu when resizing above mobile breakpoint
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const techStack = [
    { name: 'Internet Computer', icon: <i className="fa-solid fa-network-wired" aria-hidden="true" />, desc: 'Decentralized blockchain platform' },
    { name: 'Rust Backend', icon: <i className="fa-solid fa-cogs" aria-hidden="true" />, desc: 'High-performance, memory-safe' },
    { name: 'React Frontend', icon: <i className="fa-brands fa-react" aria-hidden="true" />, desc: 'Modern, responsive UI' },
    { name: 'AI Integration', icon: <i className="fa-solid fa-robot" aria-hidden="true" />, desc: 'Llama 3.1 8B model' },
    { name: 'OCR Technology', icon: <i className="fa-solid fa-eye" aria-hidden="true" />, desc: 'PDF processing & extraction' },
    { name: 'Blockchain Security', icon: <i className="fa-solid fa-lock" aria-hidden="true" />, desc: 'Immutable, tamper-proof' }
  ];

  const problemPoints = [
    'Security vulnerabilities in paper prescriptions',
    'Lack of transparency between doctors and patients', 
    'Limited access to medication information',
    'No real-time support for medication queries',
    'Fragmented healthcare communication'
  ];

  const solutionFeatures = [
    { icon: <i className="fa-solid fa-lock" aria-hidden="true" />, title: 'Blockchain Security', desc: 'Immutable prescription records on Internet Computer' },
    { icon: <i className="fa-solid fa-robot" aria-hidden="true" />, title: 'AI Health Assistant', desc: 'Llama 3.1 powered medication guidance with audio & video responses' },
    { icon: <i className="fa-solid fa-mobile-screen-button" aria-hidden="true" />, title: 'Digital Ecosystem', desc: 'Seamless doctor-patient communication' },
    { icon: <i className="fa-solid fa-eye" aria-hidden="true" />, title: 'OCR Technology', desc: 'Digitize medicine guides automatically' },
    { icon: <i className="fa-solid fa-user-shield" aria-hidden="true" />, title: 'Privacy First', desc: 'Decentralized, role-based access control' },
    { icon: <i className="fa-solid fa-bolt" aria-hidden="true" />, title: 'Real-time Support', desc: '24/7 AI-powered health assistance with multimedia responses' }
  ];

  const doctorFeatures = [
    { icon: <i className="fa-solid fa-pills" aria-hidden="true" />, title: 'Medicine Repository', desc: 'Build comprehensive medicine database with OCR-powered guide extraction' },
    { icon: <i className="fa-solid fa-file-medical" aria-hidden="true" />, title: 'Smart Prescriptions', desc: 'Generate secure digital prescriptions with unique verification codes' },
    { icon: <i className="fa-solid fa-robot" aria-hidden="true" />, title: 'AI Medical Assistant', desc: 'Intelligent support with audio & video responses for drug interactions and clinical decisions' },
    { icon: <i className="fa-solid fa-chart-line" aria-hidden="true" />, title: 'Analytics Dashboard', desc: 'Track prescription access and patient engagement metrics' }
  ];

  const patientFeatures = [
    { icon: <i className="fa-solid fa-lock" aria-hidden="true" />, title: 'Secure Access', desc: 'Access prescriptions using unique ID and verification codes' },
    { icon: <i className="fa-solid fa-clipboard" aria-hidden="true" />, title: 'Detailed Information', desc: 'View comprehensive medicine details, dosages, and side effects' },
    { icon: <i className="fa-solid fa-comments" aria-hidden="true" />, title: 'AI Health Partner', desc: 'Get personalized medication guidance through text, audio, and video responses' },
    { icon: <i className="fa-solid fa-file-prescription" aria-hidden="true" />, title: 'Prescription History', desc: 'Maintain secure history of all accessed prescriptions' }
  ];

  const metrics = [
    { value: '100%', label: 'Blockchain Secured', icon: <i className="fa-solid fa-link" aria-hidden="true" /> },
    { value: '24/7', label: 'AI Support', icon: <i className="fa-solid fa-robot" aria-hidden="true" /> },
    { value: '0', label: 'Single Points of Failure', icon: <i className="fa-solid fa-shield" aria-hidden="true" /> },
    { value: 'Real-time', label: 'Prescription Access', icon: <i className="fa-solid fa-bolt" aria-hidden="true" /> }
  ];

  const innovationPoints = [
    {
      icon: <i className="fa-solid fa-video" aria-hidden="true" />,
      title: 'AI Audio & Video Responses',
      desc: 'First healthcare AI with multimedia explanations - audio and video guidance for complex medical instructions',
      highlight: 'Revolutionary'
    },
    {
      icon: <i className="fa-solid fa-globe" aria-hidden="true" />,
      title: 'Internet Computer Blockchain',
      desc: 'First healthcare platform leveraging IC for true decentralization',
      highlight: 'Cutting-Edge'
    },
    {
      icon: <i className="fa-solid fa-brain" aria-hidden="true" />,
      title: 'Context-Aware AI',
      desc: 'Llama 3.1 8B model trained for medical assistance with multimedia outputs',
      highlight: 'Innovative'
    },
    {
      icon: <i className="fa-solid fa-lock" aria-hidden="true" />,
      title: 'Zero-Trust Architecture',
      desc: 'Role-based access with cryptographic verification',
      highlight: 'Secure'
    }
  ];

  const scrollToSection = useCallback((sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // ensure mobile menu closes after navigation
      setMobileMenuOpen(false);
    }
  }, []);

  const handleInstallPWA = async () => {
    if (isInstalling) return;
    
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        const result = await deferredPrompt.prompt();
        if (result.outcome === 'accepted') {
          setIsAppInstalled(true);
          setShowPWABanner(false);
          setShowInstallModal(false);
        }
      } catch (error) {
        console.error('PWA installation failed:', error);
      } finally {
        setIsInstalling(false);
        setDeferredPrompt(null);
      }
    } else {
      // Show manual installation instructions
      setShowInstallModal(true);
    }
  };

  return (
    <div className="bg-white text-gray-900 overflow-hidden">
      {/* skip link for keyboard users */}
      <a
        href="#main-content"
        className="absolute left-2 top-2 z-50 rounded-md bg-blue-600 text-white px-3 py-2 focus:not-sr-only focus:outline-none"
      >
        Skip to content
      </a>

      {/* Navigation Bar */}
      <nav role="navigation" aria-label="Main navigation" className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              {/* Replaced gradient square with favicon */}
              <img
                src="/favicon.png"
                alt="MedSeal"
                className="w-10 h-10 rounded-lg ring-1 ring-blue-200 object-contain bg-white"
                onError={(e)=>{e.currentTarget.style.display='none';}}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">MedSeal</h1>
                <p className="text-xs text-gray-500">Healthcare Platform</p>
              </div>
            </div>

            {/* Navigation Links - desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <button type="button" onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Features</button>
              <button type="button" onClick={() => scrollToSection('pwa')} className="text-gray-600 hover:text-green-600 font-medium transition-colors">
                <i className="fa-solid fa-mobile-screen-button mr-1" aria-hidden="true" />
                Install App
              </button>
              <button type="button" onClick={() => scrollToSection('technology')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Technology</button>
              <button type="button" onClick={() => scrollToSection('security')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Security</button>
              <button type="button" onClick={() => scrollToSection('quick-start')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Get Started</button>
            </div>

            {/* mobile hamburger + action buttons */}
            <div className="flex items-center space-x-3">
              <div className="md:hidden">
                <button
                  type="button"
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen((s) => !s)}
                  className="p-2 rounded-md text-gray-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>

              <button type="button" onClick={handleLogin} aria-label="Sign in" className="px-4 py-2 text-blue-600 font-medium hover:text-blue-700 transition-colors">Sign In</button>
              <button type="button" onClick={handleRegister} aria-label="Get started" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Get Started</button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-blue-100">
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
              <button type="button" onClick={() => scrollToSection('features')} className="text-left text-gray-700">Features</button>
              <button type="button" onClick={() => scrollToSection('technology')} className="text-left text-gray-700">Technology</button>
              <button type="button" onClick={() => scrollToSection('security')} className="text-left text-gray-700">Security</button>
              <button type="button" onClick={() => scrollToSection('quick-start')} className="text-left text-gray-700">Get Started</button>
              <div className="pt-2 border-t border-blue-50">
                <button type="button" onClick={handleRegister} className="w-full py-2 bg-blue-600 text-white rounded-md">Create Account</button>
                <button type="button" onClick={handleLogin} className="w-full py-2 mt-2 border border-blue-200 rounded-md">Sign In</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* PWA Install Notification */}
      {showPWABanner && !isAppInstalled && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 shadow-lg border-b border-blue-500">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-mobile-screen-button text-white" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-semibold text-sm"><i className="fa-solid fa-mobile-screen-button mr-1" aria-hidden="true" />Install MedSeal as PWA</div>
                  <div className="text-xs text-blue-100">Get native app experience with offline access & push notifications</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-4 text-xs text-blue-200">
                  <div className="flex items-center space-x-1">
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                    <span>Offline Ready</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></span>
                    <span>Real-time Updates</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></span>
                    <span>Native Performance</span>
                  </div>
                </div>
                <button 
                  onClick={handleInstallPWA}
                  disabled={isInstalling}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded-md text-xs font-medium transition-colors flex items-center space-x-1"
                >
                  {isInstalling && (
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isInstalling ? 'Installing...' : 'Install Now'}</span>
                </button>
                <button 
                  onClick={() => setShowPWABanner(false)}
                  className="ml-2 p-1 hover:bg-white/20 rounded text-xs"
                  aria-label="Dismiss install banner"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content for skip link target */}
      <main id="main-content" className="pt-28">
        {/* Hero Section */}
        <section id="hero" className="relative h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden flex items-center pt-0" aria-label="Hero">
          {/* Animated Background (non-interactive so it can't block clicks) */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-1/4 left-1/4 w-56 h-56 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>

          <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center w-full max-h-[85vh]">
              <div className="lg:col-span-7 space-y-2">
                {/* MedSeal Brand Badge */}
                <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20 animate-fade-in">
                  {/* <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center"> */}
                  {/* Replace with favicon */}
                  <img
                    src="/favicon.png"
                    alt="MedSeal"
                    className="w-5 h-5 rounded-md object-contain"
                    onError={(e)=>{e.currentTarget.style.display='none';}}
                  />
                  {/* </div> */}
                  <span className="text-sm font-bold">MedSeal</span>
                  <span className="text-xs text-blue-200 bg-blue-500/30 px-2 py-0.5 rounded-full">NEW</span>
                </div>

                <div className="animate-slide-up">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold leading-tight mb-2">
                    <span className="bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                      Healthcare Revolution
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-300 via-white to-blue-100 bg-clip-text text-transparent">
                      Blockchain + AI
                    </span>
                  </h1>

                  <p className="text-sm md:text-base text-blue-100 leading-relaxed max-w-xl mb-3">
                    First blockchain prescription platform with AI assistance featuring <span className="text-yellow-300 font-bold">audio & video responses</span>. 
                    <span className="text-white font-semibold">Secure, intelligent, revolutionary.</span>
                  </p>
                </div>

                {/* Key Value Props */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 animate-slide-up" style={{animationDelay: '0.3s'}}>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 group">
                    <div className="text-2xl mb-2"><i className="fa-solid fa-lock" aria-hidden="true" /></div>
                    <div className="font-semibold text-white">Blockchain Security</div>
                    <div className="text-sm text-blue-200">Immutable & Tamper-proof</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 group relative">
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full animate-pulse">NEW</div>
                    <div className="text-2xl mb-2"><i className="fa-solid fa-video" aria-hidden="true" /></div>
                    <div className="font-semibold text-white">Audio & Video AI</div>
                    <div className="text-sm text-blue-200">Multimedia Health Guidance</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 group">
                    <div className="text-2xl mb-2"><i className="fa-solid fa-globe" aria-hidden="true" /></div>
                    <div className="font-semibold text-white">Decentralized</div>
                    <div className="text-sm text-blue-200">Internet Computer Network</div>
                  </div>
                </div>

                {/* Call to Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 animate-slide-up" style={{animationDelay: '0.6s'}}>
                  <button
                    onClick={handleRegister}
                    className="group px-10 py-4 bg-white text-blue-600 font-bold text-lg rounded-xl hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-2xl flex items-center justify-center space-x-2"
                  >
                    <i className="fa-solid fa-rocket" aria-hidden="true" />
                    <span>Start with MedSeal</span>
                  </button>
                  <button
                    onClick={handleLogin}
                    className="px-10 py-4 border-2 border-white/50 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-md flex items-center justify-center space-x-2"
                  >
                    <i className="fa-solid fa-briefcase" aria-hidden="true" />
                    <span>Access Platform</span>
                  </button>
                </div>

                {/* Trust Indicators & Scroll Indicator Combined */}
                <div className="flex items-center justify-between pt-2 animate-fade-in" style={{animationDelay: '0.9s'}}>
                  <div className="flex items-center gap-3 text-xs text-blue-200">
                    <div className="flex items-center space-x-1">
                      <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                      <span>Enterprise</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></span>
                      <span>Blockchain</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></span>
                      <span>AI-Powered</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => scrollToSection('problem-solution')}
                    className="text-white hover:text-blue-200 transition-colors animate-bounce"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative animate-fade-in" style={{animationDelay: '1.2s'}}>
                  {/* Main Demo Card */}
                  <div className="bg-white/95 backdrop-blur-lg rounded-xl p-3 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="text-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">MedSeal Platform</h3>
                      <p className="text-gray-600 font-medium text-xs">Healthcare Technology</p>
                      <div className="mt-1 inline-flex items-center space-x-1 bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs font-medium">
                        <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                        <span>Live</span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {metrics.slice(0, 4).map((metric, index) => (
                        <div key={index} className="text-center p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-300 group">
                          <div className="text-sm mb-0.5 group-hover:scale-110 transition-transform">{metric.icon}</div>
                          <div className="text-xs font-bold text-blue-800">{metric.value}</div>
                          <div className="text-xs text-blue-600">{metric.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleRegister}
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-xs rounded-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        <i className="fa-solid fa-rocket mr-1" aria-hidden="true" />Join Platform
                      </button>
                      <button
                        onClick={handleLogin}
                        className="w-full py-2 border border-blue-600 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-50 transition-all duration-200"
                      >
                        <i className="fa-solid fa-briefcase mr-1" aria-hidden="true" />Sign In
                      </button>
                    </div>
                  </div>

                  {/* Minimal Floating Elements (non-interactive) */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full opacity-20 animate-pulse pointer-events-none"></div>
                  <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem & Solution */}
        <section id="problem-solution" className="py-20 bg-gradient-to-br from-blue-50 to-blue-100 scroll-mt-16" aria-label="Problem and solution">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-blue-600 text-white rounded-full px-6 py-3 mb-6">
                <i className="fa-solid fa-mobile-screen-button" aria-hidden="true" />
                <span className="font-bold">MedSeal Solution</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Why MedSeal is <span className="text-blue-600">Revolutionary</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                MedSeal addresses critical healthcare challenges with innovative blockchain and AI technology
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 bg-red-100 text-red-800 rounded-full px-4 py-2 mb-6">
                  <i className="fa-solid fa-triangle-exclamation mr-2" aria-hidden="true" />
                  <span className="font-semibold">Current Healthcare Problems</span>
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Healthcare Challenges <span className="text-red-600">MedSeal Solves</span>
                </h3>
                
                <div className="space-y-4">
                  {problemPoints.map((point, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <i className="fa-solid fa-xmark text-white text-xs" aria-hidden="true" />
                      </div>
                      <span className="text-gray-700 leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 mb-6">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">MedSeal Features</span>
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  How <span className="text-blue-600">MedSeal Works</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {solutionFeatures.map((feature, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 shadow-lg border border-blue-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                      <div className="text-2xl mb-2">{feature.icon}</div>
                      <h4 className="font-bold text-gray-900 mb-1">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PWA Features */}
        <section id="pwa" className="py-20 bg-gradient-to-br from-green-50 to-blue-50 scroll-mt-16" aria-label="PWA Features">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-green-600 text-white rounded-full px-6 py-3 mb-6">
                <i className="fa-solid fa-mobile-screen-button" aria-hidden="true" />
                <span className="font-bold">Progressive Web App</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Install MedSeal as a <span className="text-green-600">Native App</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Experience MedSeal like a native mobile app with enhanced performance, offline capabilities, and seamless integration
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {[
                {
                  icon: <i className="fa-solid fa-download" aria-hidden="true" />,
                  title: 'One-Click Install',
                  desc: 'Install directly from your browser without app stores',
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  icon: <i className="fa-solid fa-wifi" aria-hidden="true" />,
                  title: 'Offline Access',
                  desc: 'Access core features even without internet connection',
                  color: 'from-green-500 to-green-600'
                },
                {
                  icon: <i className="fa-solid fa-bolt" aria-hidden="true" />,
                  title: 'Native Performance',
                  desc: 'Lightning-fast loading and smooth interactions',
                  color: 'from-yellow-500 to-orange-500'
                },
                {
                  icon: <i className="fa-solid fa-bell" aria-hidden="true" />,
                  title: 'Push Notifications',
                  desc: 'Get real-time updates and important alerts',
                  color: 'from-purple-500 to-purple-600'
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-2xl text-white mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Installation Guide */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">How to Install MedSeal PWA</h3>
                <p className="text-gray-600">Choose your browser and follow the simple steps</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    browser: 'Chrome/Edge',
                    icon: <i className="fa-brands fa-chrome" aria-hidden="true" />,
                    steps: ['Look for install icon in address bar', 'Click "Install MedSeal"', 'Confirm installation']
                  },
                  {
                    browser: 'Safari',
                    icon: <i className="fa-brands fa-safari" aria-hidden="true" />,
                    steps: ['Tap Share button', 'Select "Add to Home Screen"', 'Tap "Add" to confirm']
                  },
                  {
                    browser: 'Firefox',
                    icon: <i className="fa-brands fa-firefox" aria-hidden="true" />,
                    steps: ['Open menu (three lines)', 'Select "Install this app"', 'Click "Install" button']
                  }
                ].map((guide, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl text-white mx-auto mb-4">
                      {guide.icon}
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">{guide.browser}</h4>
                    <ol className="text-sm text-gray-600 space-y-2">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start space-x-2">
                          <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {stepIndex + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button 
                  onClick={handleInstallPWA}
                  disabled={isInstalling}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                >
                  {isInstalling ? (
                    <> 
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Installing...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-download" aria-hidden="true" />
                      <span>Install MedSeal Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Benefits Highlight */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="text-3xl mb-3"><i className="fa-solid fa-rocket" aria-hidden="true" /></div>
                <h4 className="font-bold text-gray-900 mb-2">Faster Loading</h4>
                <p className="text-sm text-gray-600">Up to 3x faster loading times compared to web browser</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="text-3xl mb-3"><i className="fa-solid fa-mobile-screen-button" aria-hidden="true" /></div>
                <h4 className="font-bold text-gray-900 mb-2">Native Feel</h4>
                <p className="text-sm text-gray-600">Full-screen experience with native app-like interactions</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="text-3xl mb-3"><i className="fa-solid fa-sync" aria-hidden="true" /></div>
                <h4 className="font-bold text-gray-900 mb-2">Auto Updates</h4>
                <p className="text-sm text-gray-600">Always stay updated with the latest features automatically</p>
              </div>
            </div>
          </div>
        </section>

        {/* Innovation Highlights */}
        <section id="technology" className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white scroll-mt-16" aria-label="Technology">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-3 bg-white/15 backdrop-blur-md rounded-full px-6 py-3 mb-6 border border-white/20">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                </div>
                <span className="font-bold text-lg">MedSeal Technology</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Advanced <span className="text-blue-300">Technology Stack</span>
              </h2>
              <p className="text-xl text-blue-200 max-w-3xl mx-auto">
                MedSeal leverages cutting-edge blockchain and AI technology with breakthrough audio & video response capabilities
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {innovationPoints.map((point, index) => (
                <div key={index} className="relative group">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 h-full">
                    <div className="absolute top-4 right-4">
                      <span className="bg-blue-300 text-blue-900 text-xs font-bold px-2 py-1 rounded-full">
                        {point.highlight}
                      </span>
                    </div>
                    <div className="text-4xl mb-4">{point.icon}</div>
                    <h3 className="text-xl font-bold mb-3">{point.title}</h3>
                    <p className="text-blue-200 leading-relaxed">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section id="features" className="py-20 bg-white scroll-mt-16" aria-label="Features">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-blue-600 text-white rounded-full px-6 py-3 mb-6">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">MedSeal Features</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Complete <span className="text-blue-600">Healthcare Platform</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                MedSeal provides comprehensive tools for healthcare providers and patients with enterprise-grade security
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-12">
              <div className="bg-blue-100 rounded-full p-1 flex border border-blue-200">
                <button
                  onClick={() => setActiveTab('doctors')}
                  className={`px-8 py-3 rounded-full font-semibold transition-all duration-200 ${
                    activeTab === 'doctors' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  <i className="fa-solid fa-user-doctor mr-2" aria-hidden="true" />For Healthcare Providers
                </button>
                <button
                  onClick={() => setActiveTab('patients')}
                  className={`px-8 py-3 rounded-full font-semibold transition-all duration-200 ${
                    activeTab === 'patients' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  <i className="fa-solid fa-users mr-2" aria-hidden="true" />For Patients
                </button>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(activeTab === 'doctors' ? doctorFeatures : patientFeatures).map((feature, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-blue-200 hover:shadow-xl hover:-translate-y-2 hover:border-blue-300 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-2xl mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section id="tech-stack" className="py-20 bg-gradient-to-br from-blue-50 to-blue-100 scroll-mt-16" aria-label="Tech stack">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-blue-600 text-white rounded-full px-6 py-3 mb-6">
                <span>⚡</span>
                <span className="font-bold">MedSeal Technology</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Built with <span className="text-blue-600">Enterprise Technology</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                MedSeal leverages the most advanced technologies for security, performance, and scalability
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {techStack.map((tech, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-3xl">{tech.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900">{tech.name}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{tech.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section id="cta" className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden scroll-mt-16" aria-label="Call to action">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center space-x-3 bg-white/15 backdrop-blur-md rounded-full px-6 py-3 mb-8 border border-white/20">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-shield-halved text-blue-600" aria-hidden="true" />
                </div>
                <span className="font-bold text-lg">Ready to Transform Healthcare</span>
              </div>

              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Join the MedSeal
                <span className="block text-blue-300">Healthcare Revolution</span>
              </h2>

              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Experience the future of digital healthcare with MedSeal's blockchain-powered platform. 
                Secure, intelligent, and designed for modern healthcare professionals and patients.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
                <button
                  onClick={handleRegister}
                  className="px-10 py-4 bg-white text-blue-600 font-bold text-lg rounded-xl hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-2xl"
                >
                  <i className="fa-solid fa-rocket" aria-hidden="true" />
                  <span>Start with MedSeal</span>
                </button>
                <button
                  onClick={handleLogin}
                  className="px-10 py-4 border-2 border-white/50 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-md"
                >
                  <i className="fa-solid fa-briefcase" aria-hidden="true" />
                  <span>Access Platform</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold"><i className="fa-solid fa-lock" aria-hidden="true" /></div>
                  <div className="text-sm text-blue-200">Enterprise Security</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold"><i className="fa-solid fa-rocket" aria-hidden="true" /></div>
                  <div className="text-sm text-blue-200">Production Ready</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold"><i className="fa-solid fa-globe" aria-hidden="true" /></div>
                  <div className="text-sm text-blue-200">Blockchain Powered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold"><i className="fa-solid fa-gem" aria-hidden="true" /></div>
                  <div className="text-sm text-blue-200">Professional Grade</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-20 bg-gradient-to-br from-blue-50 via-white to-blue-50 scroll-mt-16" aria-label="Security">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <div className="inline-flex items-center space-x-2 bg-blue-600 text-white rounded-full px-6 py-2 mb-5">
                <i className="fa-solid fa-shield-halved mr-2" aria-hidden="true" /><span className="font-semibold">Security & Privacy</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900">
                Built for <span className="text-blue-600">Trust & Compliance</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                MedSeal enforces zero‑trust principles with immutable records and strict role isolation.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon:<i className="fa-solid fa-link" aria-hidden="true" />, title:'Immutable Records', desc:'Prescriptions anchored on Internet Computer for tamper-proof integrity.' },
                { icon:<i className="fa-solid fa-puzzle-piece" aria-hidden="true" />, title:'Role Isolation', desc:'Granular doctor / patient separation prevents unauthorized data exposure.' },
                { icon:<i className="fa-solid fa-key" aria-hidden="true" />, title:'Cryptographic Verification', desc:'Unique verification codes validate authenticity instantly.' },
                { icon:<i className="fa-solid fa-lock" aria-hidden="true" />, title:'End-to-End Protection', desc:'Encrypted in transit & at rest with decentralized execution.' }
              ].map((item,i)=>(
                <div key={i} className="bg-white rounded-2xl p-6 border border-blue-100 hover:border-blue-300 hover:shadow-lg transition">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-2xl mb-4">{item.icon}</div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Integration */}
        <section id="ai" className="py-20 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white scroll-mt-16" aria-label="AI integration">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md rounded-full px-6 py-2 mb-5 border border-white/20">
                <i className="fa-solid fa-robot mr-2" aria-hidden="true" /><span className="font-semibold">AI Health Partner</span>
              </div>
              <h2 className="text-4xl font-bold">
                Intelligent <span className="text-blue-300">Clinical Support</span>
              </h2>
              <p className="mt-4 text-lg text-blue-200 max-w-3xl mx-auto">
                Revolutionary AI healthcare assistant featuring <span className="text-yellow-300 font-bold">audio and video explanations</span> - the first of its kind in digital healthcare.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon:<i className="fa-solid fa-comments" aria-hidden="true" />, title:'Multimedia Guidance', desc:'Natural language clarification with audio & video responses for complex medication instructions.' },
                { icon:<i className="fa-solid fa-volume-high" aria-hidden="true" />, title:'Audio Responses', desc:'Clear spoken explanations for medication timing, dosage, and usage instructions.' },
                { icon:<i className="fa-solid fa-video" aria-hidden="true" />, title:'Video Demonstrations', desc:'Visual explanations and demonstrations for proper medication administration.' },
                { icon:<i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />, title:'Smart Alerts', desc:'Multi-modal alerts for potential drug interactions and safety warnings.' }
              ].map((a,i)=>(
                <div key={i} className="relative group">
                  <div className="h-full bg-white/10 border border-white/15 rounded-2xl p-6 backdrop-blur-md group-hover:bg-white/15 transition">
                    <div className="text-3xl mb-4">{a.icon}</div>
                    <h3 className="font-semibold text-lg mb-2">{a.title}</h3>
                    <p className="text-sm text-blue-200 leading-relaxed">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-300 mt-8 text-center">
              AI outputs including audio and video responses are assistive and not a substitute for professional medical judgment.
            </p>
          </div>
        </section>

        {/* Quick Start */}
        <section id="quick-start" className="py-20 bg-white scroll-mt-16" aria-label="Quick start">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-blue-600 text-white rounded-full px-6 py-2 mb-5">
                <i className="fa-solid fa-rocket" aria-hidden="true" />
                <span className="font-semibold">Getting Started</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900">
                Launch on <span className="text-blue-600">MedSeal in Minutes</span>
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { step:'01', title:'Create Account', desc:'Register securely as a healthcare provider or patient.' },
                { step:'02', title:'Add / Access Data', desc:'Doctors add medicines & create prescriptions; patients retrieve securely.' },
                { step:'03', title:'AI Assistance', desc:'Engage the AI for clarity, safety context & medication literacy.' },
                { step:'04', title:'Monitor & Grow', desc:'Track access metrics; build a trusted digital care workflow.' }
              ].map((s,i)=>(
                <div key={i} className="relative bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-6 hover:shadow-lg transition">
                  <div className="absolute -top-4 left-4 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-bold shadow">{s.step}</div>
                  <div className="pt-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{s.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRegister}
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow transition"
              >
                Get Started Now
              </button>
              <button
                onClick={handleLogin}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-blue-900 text-white pt-16 pb-10" aria-label="Footer">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 md:grid-cols-4">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold">MedSeal</h3>
                </div>
                <p className="text-blue-200 text-sm leading-relaxed">
                  Secure, intelligent, and compliant digital prescription infrastructure powered by the Internet Computer and advanced AI.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li>Healthcare Providers</li>
                  <li>Patients</li>
                  <li>AI Assistance</li>
                  <li>Security Model</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Technology</h4>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li>Internet Computer</li>
                  <li>Rust Canisters</li>
                  <li>React Frontend</li>
                  <li>Llama 3.1 AI</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Get Started</h4>
                <div className="space-y-3">
                  <button
                    onClick={handleRegister}
                    className="w-full px-5 py-2 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={handleLogin}
                    className="w-full px-5 py-2 border border-blue-400 text-blue-200 font-medium rounded-lg hover:bg-blue-800 transition"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-12 border-t border-blue-700 pt-6 text-center">
              <p className="text-xs text-blue-300">
                © {new Date().getFullYear()} MedSeal. All rights reserved. Built for secure digital healthcare.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* PWA Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-mobile-screen-button text-3xl text-white" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Install MedSeal PWA</h3>
              <p className="text-gray-600">Follow these simple steps to install MedSeal as a native app</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <i className="fa-brands fa-chrome text-xl text-blue-500" aria-hidden="true" />
                  <span className="font-semibold">Chrome / Edge</span>
                </div>
                <ol className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>1. Look for the install icon <i className="fa-solid fa-download" aria-hidden="true" /> in the address bar</li>
                  <li>2. Click "Install MedSeal"</li>
                  <li>3. Confirm installation</li>
                </ol>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <i className="fa-brands fa-safari text-xl text-blue-500" aria-hidden="true" />
                  <span className="font-semibold">Safari (iOS)</span>
                </div>
                <ol className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>1. Tap the Share button <i className="fa-solid fa-share" aria-hidden="true" /></li>
                  <li>2. Select "Add to Home Screen"</li>
                  <li>3. Tap "Add" to confirm</li>
                </ol>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <i className="fa-brands fa-firefox text-xl text-orange-500" aria-hidden="true" />
                  <span className="font-semibold">Firefox</span>
                </div>
                <ol className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>1. Open menu (three lines)</li>
                  <li>2. Select "Install this app"</li>
                  <li>3. Click "Install" button</li>
                </ol>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowInstallModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Got it
              </button>
              <button
                onClick={() => {
                  setShowInstallModal(false);
                  // Try to trigger install prompt if available
                  if (deferredPrompt) {
                    handleInstallPWA();
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-up {
          animation: slide-up 1s ease-out forwards;
          opacity: 0;
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        .scroll-mt-16 {
          scroll-margin-top: 5rem;
        }
        /* keep decorative overlays non-interactive */
        .pointer-events-none { pointer-events: none; }
        /* enhanced focus styles for skip link */
        a:focus { outline: 3px solid rgba(59,130,246,0.8); outline-offset: 2px; }
        /* Enhanced hover effects */
        .group:hover .group-hover\\:scale-110 {
          transform: scale(1.1);
        }
        .group:hover .group-hover\\:translate-x-1 {
          transform: translateX(0.25rem);
        }
      `}</style>
    </div>
  );
};

export default memo(LandingPage);