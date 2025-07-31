import { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const formatPrincipal = (principal) => {
    if (!principal) return 'N/A';
    if (principal.length <= 16) return principal;
    return `${principal.slice(0, 8)}...${principal.slice(-8)}`;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">MedSeal</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden md:block font-medium">{user?.name}</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user?.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user?.role === 'Doctor' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user?.role === 'Doctor' ? '🩺' : '👤'} {user?.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="space-y-2 text-sm">
                      {user?.role === 'Doctor' && user?.license_number && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">License:</span>
                          <span className="text-gray-900 font-mono">{user.license_number}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Principal ID:</span>
                        <span className="text-gray-900 font-mono text-xs" title={user?.user_principal}>
                          {formatPrincipal(user?.user_principal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">User ID:</span>
                        <span className="text-gray-900 font-mono text-xs">
                          {user?.id?.length > 12 ? `${user.id.slice(0, 6)}...${user.id.slice(-6)}` : user?.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Member since:</span>
                        <span className="text-gray-900">
                          {user?.created_at ? new Date(Number(user.created_at) / 1000000).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(user?.user_principal || '');
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <span className="mr-3">📋</span>
                      Copy Principal ID
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                    >
                      <span className="mr-3">🚪</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </nav>
  );
}

export default Navbar;