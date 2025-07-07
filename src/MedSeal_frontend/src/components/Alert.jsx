import { useState, useEffect } from 'react';

function Alert({ type = 'info', message, onClose, autoClose = false, duration = 5000 }) {
  const [show, setShow] = useState(!!message);

  useEffect(() => {
    setShow(!!message);
    
    if (message && autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [message, autoClose, duration]);

  const handleClose = () => {
    setShow(false);
    if (onClose) {
      setTimeout(() => onClose(), 150); // Allow animation to complete
    }
  };

  if (!show || !message) return null;

  const getAlertClass = () => {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
      case 'danger':
        return 'alert-danger';
      case 'warning':
        return 'alert-warning';
      case 'info':
      default:
        return 'alert-info';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
      case 'danger':
        return 'fas fa-exclamation-triangle';
      case 'warning':
        return 'fas fa-exclamation-circle';
      case 'info':
      default:
        return 'fas fa-info-circle';
    }
  };

  return (
    <div className={`alert ${getAlertClass()} alert-dismissible fade show`} role="alert">
      <i className={`${getIcon()} me-2`}></i>
      {message}
      <button 
        type="button" 
        className="btn-close" 
        onClick={handleClose}
        aria-label="Close"
      ></button>
    </div>
  );
}

export default Alert;
