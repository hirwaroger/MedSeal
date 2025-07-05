import { useState } from 'react';

function Register({ onRegister, onSwitchToLogin, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: { Doctor: null },
    license_number: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      license_number: formData.role.Doctor !== null && formData.license_number ? 
        [formData.license_number] : []
    };
    onRegister(userData);
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({
      ...prev,
      role: role === 'Doctor' ? { Doctor: null } : { Patient: null },
      license_number: role === 'Patient' ? '' : prev.license_number
    }));
  };

  return (
    <div className="row justify-content-center align-items-center min-vh-100">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow">
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <i className="fas fa-user-plus text-success" style={{fontSize: '3rem'}}></i>
              <h2 className="mt-3 text-success">Join MedSeal</h2>
              <p className="text-muted">Create your secure healthcare account</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      required
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">I am a:</label>
                <div className="row">
                  <div className="col-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="role"
                        id="doctor"
                        checked={formData.role.Doctor !== undefined}
                        onChange={() => handleRoleChange('Doctor')}
                      />
                      <label className="form-check-label" htmlFor="doctor">
                        <i className="fas fa-user-md me-2"></i>Doctor
                      </label>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="role"
                        id="patient"
                        checked={formData.role.Patient !== undefined}
                        onChange={() => handleRoleChange('Patient')}
                      />
                      <label className="form-check-label" htmlFor="patient">
                        <i className="fas fa-user me-2"></i>Patient
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {formData.role.Doctor !== undefined && (
                <div className="mb-3">
                  <label htmlFor="license" className="form-label">Medical License Number</label>
                  <input
                    type="text"
                    className="form-control"
                    id="license"
                    value={formData.license_number}
                    onChange={(e) => setFormData(prev => ({...prev, license_number: e.target.value}))}
                    required
                  />
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn btn-success w-100 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
            
            <div className="text-center">
              <p className="mb-0">Already have an account?</p>
              <button 
                className="btn btn-link p-0"
                onClick={onSwitchToLogin}
              >
                Sign in here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
