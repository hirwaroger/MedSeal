import { useState } from 'react';

function Login({ onLogin, onSwitchToRegister, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    }
  };

  return (
    <div className="row justify-content-center align-items-center min-vh-100">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow">
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <i className="fas fa-heartbeat text-primary" style={{fontSize: '3rem'}}></i>
              <h2 className="mt-3 text-primary">MedSeal</h2>
              <p className="text-muted">Secure Decentralized Health Platform</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary w-100 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
            
            <div className="text-center">
              <p className="mb-0">Don't have an account?</p>
              <button 
                className="btn btn-link p-0"
                onClick={onSwitchToRegister}
              >
                Register here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
