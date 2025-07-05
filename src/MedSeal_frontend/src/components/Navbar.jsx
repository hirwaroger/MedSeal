function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">
          <i className="fas fa-heartbeat me-2"></i>
          MedSeal
        </a>
        
        <div className="navbar-nav ms-auto">
          <div className="nav-item dropdown">
            <a 
              className="nav-link dropdown-toggle" 
              href="#" 
              role="button" 
              data-bs-toggle="dropdown"
            >
              <i className={`fas ${user.role.Doctor ? 'fa-user-md' : 'fa-user'} me-2`}></i>
              {user.name}
            </a>
            <ul className="dropdown-menu">
              <li>
                <span className="dropdown-item-text">
                  <small className="text-muted">
                    {user.role.Doctor ? 'Doctor' : 'Patient'}
                  </small>
                </span>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item" onClick={onLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
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
