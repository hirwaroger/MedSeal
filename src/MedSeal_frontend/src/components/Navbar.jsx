import { useState } from 'react';
import { useFavicon } from './useFavicon';

function Navbar({ user, onLogout }) {
  useFavicon('/favicon.png');
  const [menuOpen, setMenuOpen] = useState(false);

  const isDoctor = user.role === 'Doctor' || 
                  (typeof user.role === 'object' && user.role.Doctor !== undefined) ||
                  user.role.Doctor === null;

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            {/* Replaced SVG block with favicon image */}
            <img
              src="/favicon.png"
              alt="MedSeal"
              className="w-8 h-8 rounded-lg shadow-sm ring-1 ring-white/30 object-contain bg-white"
              onError={(e)=>{e.currentTarget.style.display='none';}}
            />
            <h1 className="text-xl font-bold text-white">MedSeal</h1>
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button
              className="flex items-center space-x-3 text-white hover:bg-white/10 px-4 py-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    {isDoctor ? (
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    )}
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">{user.name}</div>
                  <div className="text-xs bg-white/25 text-white px-2 py-0.5 rounded-full font-medium">
                    {isDoctor ? 'Doctor' : 'Patient'}
                  </div>
                </div>
              </div>
              <svg className={`w-4 h-4 ml-1 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setMenuOpen(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-sky-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Account Information</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          {isDoctor ? (
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-blue-600 font-medium">{isDoctor ? 'Healthcare Provider' : 'Patient'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <div className="px-6 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    
                    {isDoctor && user.license_number && user.license_number.trim() !== "" && (
                      <div className="px-6 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Medical License</p>
                          <p className="text-xs text-gray-500">{user.license_number}</p>
                        </div>
                      </div>
                    )}

                    <div className="px-6 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700">User Type</p>
                        <p className="text-xs text-gray-500">{isDoctor ? 'Healthcare Provider' : 'Patient Account'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-6 py-4 text-left flex items-center space-x-3 text-red-600 hover:bg-red-50 transition-colors group"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-semibold">Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;