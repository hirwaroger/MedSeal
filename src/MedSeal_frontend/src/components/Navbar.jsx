import { useEffect } from 'react';

function Navbar({ user, onLogout }) {
  useEffect(() => {
    // Initialize Bootstrap dropdown
    const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
    if (window.bootstrap) {
      dropdownElementList.forEach(dropdownToggleEl => {
        new window.bootstrap.Dropdown(dropdownToggleEl);
      });
    }
  }, []);

  // Check if user is doctor (handle both possible role structures)
  const isDoctor = user.role === 'Doctor' || 
                   (typeof user.role === 'object' && user.role.Doctor !== undefined) ||
                   user.role.Doctor === null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark">
      <div className="container-fluid px-4">
        <a className="navbar-brand d-flex align-items-center" href="#">
          <i className="fas fa-heartbeat me-2"></i>
          <span>MedSeal</span>
        </a>
        
        <div className="d-flex align-items-center">
          <div className="nav-item dropdown">
            <button 
              className="btn nav-link dropdown-toggle d-flex align-items-center text-white border-0 bg-transparent" 
              type="button"
              data-bs-toggle="dropdown" 
              aria-expanded="false"
              style={{ textDecoration: 'none' }}
            >
              <div className="me-3">
                <div className="d-flex align-items-center">
                  <div className="me-2">
                    <i className={`fas ${isDoctor ? 'fa-user-md' : 'fa-user'} fa-lg`}></i>
                  </div>
                  <div>
                    <div className="fw-semibold">{user.name}</div>
                    <div className="small opacity-75">
                      {isDoctor ? 'Doctor' : 'Patient'}
                    </div>
                  </div>
                </div>
              </div>
              <i className="fas fa-chevron-down"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow">
              <li>
                <div className="dropdown-item-text">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-envelope me-2 text-muted"></i>
                    <small className="text-muted">{user.email}</small>
                  </div>
                </div>
              </li>
              {isDoctor && user.license_number && user.license_number.trim() !== "" && (
                <li>
                  <div className="dropdown-item-text">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-certificate me-2 text-muted"></i>
                      <small className="text-muted">License: {user.license_number}</small>
                    </div>
                  </div>
                </li>
              )}
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button 
                  className="dropdown-item text-danger d-flex align-items-center" 
                  onClick={onLogout}
                  type="button"
                >
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
