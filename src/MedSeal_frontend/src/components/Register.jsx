import { useState } from 'react';

function Register({ onRegister, onSwitchToLogin, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Patient',
    license_number: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.role === 'Doctor' && !formData.license_number.trim()) {
      newErrors.license_number = 'License number is required for doctors';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role === 'Doctor' ? { Doctor: null } : { Patient: null },
        license_number: formData.role === 'Doctor' ? formData.license_number.trim() : ""
      };
      
      console.log('Registration form data:', formData); // Debug log
      console.log('Sending user data:', userData); // Debug log
      
      onRegister(userData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <div className="auth-header">
          <div className="brand-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h2>Join MedSeal</h2>
          <p>Create your secure healthcare account</p>
        </div>
        
        <div className="auth-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    <i className="fas fa-user me-2"></i>
                    Full Name
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    <i className="fas fa-envelope me-2"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    <i className="fas fa-lock me-2"></i>
                    Password
                  </label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create a password"
                    disabled={loading}
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    <i className="fas fa-lock me-2"></i>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">{errors.confirmPassword}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="form-label">
                <i className="fas fa-user-tag me-2"></i>
                Account Type
              </label>
              <div className="row">
                <div className="col-6">
                  <div className="card h-100" style={{ cursor: 'pointer' }}>
                    <div 
                      className={`card-body text-center ${formData.role === 'Doctor' ? 'bg-primary text-white' : ''}`}
                      onClick={() => handleInputChange('role', 'Doctor')}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="Doctor"
                        checked={formData.role === 'Doctor'}
                        onChange={() => handleInputChange('role', 'Doctor')}
                        className="d-none"
                      />
                      <i className="fas fa-user-md fa-2x mb-2"></i>
                      <h6 className="mb-0">Doctor</h6>
                      <small className={formData.role === 'Doctor' ? 'text-white-50' : 'text-muted'}>
                        Prescribe medications
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card h-100" style={{ cursor: 'pointer' }}>
                    <div 
                      className={`card-body text-center ${formData.role === 'Patient' ? 'bg-primary text-white' : ''}`}
                      onClick={() => handleInputChange('role', 'Patient')}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="Patient"
                        checked={formData.role === 'Patient'}
                        onChange={() => handleInputChange('role', 'Patient')}
                        className="d-none"
                      />
                      <i className="fas fa-user fa-2x mb-2"></i>
                      <h6 className="mb-0">Patient</h6>
                      <small className={formData.role === 'Patient' ? 'text-white-50' : 'text-muted'}>
                        Access prescriptions
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {formData.role === 'Doctor' && (
              <div className="mb-4">
                <label htmlFor="license" className="form-label">
                  <i className="fas fa-certificate me-2"></i>
                  Medical License Number
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.license_number ? 'is-invalid' : ''}`}
                  id="license"
                  value={formData.license_number}
                  onChange={(e) => handleInputChange('license_number', e.target.value)}
                  placeholder="Enter your medical license number (text or numbers)"
                  disabled={loading}
                />
                {errors.license_number && (
                  <div className="invalid-feedback">{errors.license_number}</div>
                )}
                <div className="form-text">
                  <i className="fas fa-info-circle me-1"></i>
                  Enter your medical license number or ID (alphanumeric)
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-success btn-lg w-100 mb-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>
                  Create Account
                </>
              )}
            </button>
          </form>
          
          <div className="text-center">
            <p className="text-muted mb-2">Already have an account?</p>
            <button 
              className="btn btn-outline-primary"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              <i className="fas fa-sign-in-alt me-2"></i>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
