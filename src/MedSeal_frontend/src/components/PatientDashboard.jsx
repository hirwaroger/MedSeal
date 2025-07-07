import { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';
import Alert from './Alert';

function PatientDashboard({ user, showAlert }) {
  const [activeTab, setActiveTab] = useState('access');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [prescriptionCode, setPrescriptionCode] = useState('');
  const [currentPrescription, setCurrentPrescription] = useState(null);
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPrescriptionHistory();
  }, []);

  const loadPrescriptionHistory = () => {
    // Load from localStorage for now (in real app, you'd have a backend method)
    const savedPrescriptions = JSON.parse(localStorage.getItem(`prescriptions_${user.id}`) || '[]');
    setPrescriptionHistory(savedPrescriptions);
  };

  const savePrescriptionToHistory = (prescription) => {
    const existingPrescriptions = JSON.parse(localStorage.getItem(`prescriptions_${user.id}`) || '[]');
    const updatedPrescriptions = [prescription, ...existingPrescriptions.filter(p => p.id !== prescription.id)];
    localStorage.setItem(`prescriptions_${user.id}`, JSON.stringify(updatedPrescriptions));
    setPrescriptionHistory(updatedPrescriptions);
  };

  const handleAccessPrescription = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCurrentPrescription(null);
    setMedicines([]);

    try {
      console.log('Accessing prescription with ID:', prescriptionId, 'Code:', prescriptionCode);
      
      // Ensure the prescription ID and code are strings and clean them
      const idString = String(prescriptionId).trim();
      const codeString = String(prescriptionCode).trim();
      
      console.log('Formatted - ID:', idString, 'Code:', codeString);
      
      // Validate input format
      if (!idString || !codeString) {
        setError('Please enter both Prescription ID and Secret Code');
        setLoading(false);
        return;
      }
      
      const result = await MedSeal_backend.get_prescription(idString, codeString);
      console.log('Prescription result:', result);
      
      if ('Ok' in result) {
        const prescriptionData = result.Ok;
        console.log('Prescription data received:', prescriptionData);
        
        setCurrentPrescription(prescriptionData);
        
        // Load medicine details with better error handling
        const medicinePromises = prescriptionData.medicines.map(async (prescMed) => {
          try {
            console.log('Loading medicine:', prescMed.medicine_id);
            const medicine = await MedSeal_backend.get_medicine(prescMed.medicine_id);
            console.log('Medicine loaded:', medicine);
            
            if (medicine) {
              return {
                ...medicine,
                custom_dosage: Array.isArray(prescMed.custom_dosage) && prescMed.custom_dosage.length > 0 
                  ? prescMed.custom_dosage[0] 
                  : prescMed.custom_dosage || null,
                custom_instructions: prescMed.custom_instructions || ''
              };
            }
            return null;
          } catch (error) {
            console.error('Error loading medicine:', prescMed.medicine_id, error);
            return null;
          }
        });
        
        const medicineDetails = await Promise.all(medicinePromises);
        const validMedicines = medicineDetails.filter(m => m !== null);
        console.log('Valid medicines loaded:', validMedicines);
        setMedicines(validMedicines);
        
        // Save to history with proper structure
        savePrescriptionToHistory(prescriptionData);
        
        // Switch to current prescription tab
        setActiveTab('current');
        
        // Clear the form
        setPrescriptionId('');
        setPrescriptionCode('');
      } else {
        console.error('Backend error:', result.Err);
        setError(result.Err);
      }
    } catch (error) {
      console.error('Error accessing prescription:', error);
      // Better error handling
      if (error.message && (error.message.includes('BigInt') || error.message.includes('serializ'))) {
        setError('Data format error. Please check your prescription code format and try again.');
      } else if (error.message && error.message.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Error accessing prescription: ' + (error.message || 'Unknown error occurred'));
      }
    }
    setLoading(false);
  };

  const handleFullCodeInput = (value) => {
    const cleanValue = value.trim();
    if (cleanValue.includes('-')) {
      const parts = cleanValue.split('-');
      if (parts.length === 2) {
        setPrescriptionId(parts[0].trim());
        setPrescriptionCode(parts[1].trim());
      }
    }
  };

  const viewHistoryPrescription = async (prescription) => {
    if (!prescription) {
      setError('Invalid prescription data');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Viewing history prescription:', prescription);
      
      // Check if prescription has medicines
      if (!prescription.medicines || prescription.medicines.length === 0) {
        setError('This prescription has no medicines associated with it');
        setLoading(false);
        return;
      }

      // Load medicine details for history prescription
      const medicinePromises = prescription.medicines.map(async (prescMed) => {
        try {
          console.log('Loading medicine for history:', prescMed.medicine_id);
          const medicine = await MedSeal_backend.get_medicine(prescMed.medicine_id);
          console.log('History medicine loaded:', medicine);
          
          if (medicine) {
            return {
              ...medicine,
              custom_dosage: Array.isArray(prescMed.custom_dosage) && prescMed.custom_dosage.length > 0 
                ? prescMed.custom_dosage[0] 
                : prescMed.custom_dosage || null,
              custom_instructions: prescMed.custom_instructions || ''
            };
          }
          return null;
        } catch (error) {
          console.error('Error loading history medicine:', prescMed.medicine_id, error);
          return null;
        }
      });
      
      const medicineDetails = await Promise.all(medicinePromises);
      const validMedicines = medicineDetails.filter(m => m !== null);
      
      console.log('Valid history medicines:', validMedicines);
      
      if (validMedicines.length === 0) {
        setError('Unable to load medicine details for this prescription');
        setLoading(false);
        return;
      }
      
      setCurrentPrescription(prescription);
      setMedicines(validMedicines);
      setActiveTab('current');
    } catch (error) {
      console.error('Error loading prescription details:', error);
      setError('Error loading prescription details: ' + (error.message || 'Unknown error'));
    }
    setLoading(false);
  };

  const downloadPrescriptionPDF = async (medicineId, medicineName) => {
    try {
      console.log('Downloading PDF for medicine:', medicineId);
      const pdfData = await MedSeal_backend.get_medicine_pdf(medicineId);
      
      if (pdfData && pdfData.length > 0) {
        console.log('PDF data received, size:', pdfData.length);
        const blob = new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Try to open in new tab first, fallback to download
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          // If popup blocked, download instead
          const a = document.createElement('a');
          a.href = url;
          a.download = `${medicineName}_guide.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        
        // Clean up after a delay
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showAlert('success', 'Medicine guide opened successfully');
      } else {
        showAlert('warning', 'No guide available for this medicine');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showAlert('error', 'Error downloading guide: ' + error.message);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="dashboard-header">
        <div className="row align-items-center">
          <div className="col">
            <h2>
              <i className="fas fa-user me-3"></i>
              Welcome, {user.name}
            </h2>
            <p className="text-muted mb-0">Access and manage your medical prescriptions securely</p>
          </div>
        </div>
      </div>
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'access' ? 'active' : ''}`}
            onClick={() => setActiveTab('access')}
          >
            <i className="fas fa-key me-2"></i>
            Access Prescription
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
            disabled={!currentPrescription}
          >
            <i className="fas fa-prescription me-2"></i>
            Current Prescription
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="fas fa-history me-2"></i>
            Prescription History ({prescriptionHistory.length})
          </button>
        </li>
      </ul>

      {/* Access Prescription Tab */}
      {activeTab === 'access' && (
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-unlock me-2"></i>
                  Access Your Prescription
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="alert alert-info mb-4">
                  <i className="fas fa-info-circle me-2"></i>
                  Enter the Prescription ID and Secret Code provided by your doctor to access your secure prescription.
                </div>
                
                <form onSubmit={handleAccessPrescription}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="prescriptionId" className="form-label fw-semibold">
                        <i className="fas fa-hashtag me-2"></i>
                        Prescription ID
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        id="prescriptionId"
                        value={prescriptionId}
                        onChange={(e) => setPrescriptionId(e.target.value)}
                        placeholder="e.g., 123456"
                        disabled={loading}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="prescriptionCode" className="form-label fw-semibold">
                        <i className="fas fa-key me-2"></i>
                        Secret Code
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        id="prescriptionCode"
                        value={prescriptionCode}
                        onChange={(e) => setPrescriptionCode(e.target.value)}
                        placeholder="e.g., 789012"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="fullCode" className="form-label fw-semibold">
                      <i className="fas fa-paste me-2"></i>
                      Or paste complete prescription code:
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="fullCode"
                      placeholder="e.g., 123456-789012"
                      onChange={(e) => handleFullCodeInput(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading || !prescriptionId || !prescriptionCode}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Accessing Prescription...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-unlock me-2"></i>
                        Access Prescription
                      </>
                    )}
                  </button>
                </form>
                
                {error && (
                  <Alert 
                    type="error"
                    message={error}
                    onClose={() => setError('')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Prescription Tab */}
      {activeTab === 'current' && currentPrescription && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="prescription-header card-header">
                <h5 className="mb-0">
                  <i className="fas fa-prescription me-2"></i>
                  Prescription Details
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card bg-light h-100">
                      <div className="card-body">
                        <h6 className="text-primary">
                          <i className="fas fa-user me-2"></i>Patient Information
                        </h6>
                        <p className="mb-2"><strong>Name:</strong> {currentPrescription.patient_name}</p>
                        <p className="mb-2"><strong>Contact:</strong> {currentPrescription.patient_contact}</p>
                        <p className="mb-0">
                          <strong>Prescribed:</strong> {' '}
                          {new Date(Number(currentPrescription.created_at) / 1000000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-light h-100">
                      <div className="card-body">
                        <h6 className="text-primary">
                          <i className="fas fa-info-circle me-2"></i>Prescription Details
                        </h6>
                        <p className="mb-2"><strong>ID:</strong> <code>{currentPrescription.id}</code></p>
                        <p className="mb-2"><strong>Doctor ID:</strong> <code>{currentPrescription.doctor_id}</code></p>
                        {currentPrescription.accessed_at && (
                          <p className="mb-0">
                            <strong>First Accessed:</strong> {' '}
                            {new Date(Number(currentPrescription.accessed_at) / 1000000).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <h6 className="text-primary mb-3">
                  <i className="fas fa-pills me-2"></i>Prescribed Medicines ({medicines.length})
                </h6>
                <div className="row">
                  {medicines.map((medicine, index) => (
                    <div key={index} className="col-lg-6 mb-4">
                      <div className="prescription-medicine card h-100">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <h6 className="text-primary mb-0">{medicine.name}</h6>
                            {medicine.guide_pdf_data && (
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => downloadPrescriptionPDF(medicine.id, medicine.name)}
                              >
                                <i className="fas fa-download me-1"></i>Guide
                              </button>
                            )}
                          </div>
                          
                          <div className="row text-sm">
                            <div className="col-6 mb-2">
                              <strong className="text-muted">Dosage:</strong><br/>
                              <span className="badge bg-info">{medicine.custom_dosage || medicine.dosage}</span>
                            </div>
                            <div className="col-6 mb-2">
                              <strong className="text-muted">Frequency:</strong><br/>
                              <span className="badge bg-secondary">{medicine.frequency}</span>
                            </div>
                            <div className="col-6 mb-2">
                              <strong className="text-muted">Duration:</strong><br/>
                              <span className="badge bg-warning text-dark">{medicine.duration}</span>
                            </div>
                            <div className="col-6 mb-2">
                              <strong className="text-muted">Status:</strong><br/>
                              <span className="badge bg-success">Active</span>
                            </div>
                          </div>
                          
                          {medicine.custom_instructions && (
                            <div className="mt-3">
                              <strong className="text-muted">Special Instructions:</strong>
                              <p className="small mb-0 mt-1 p-2 bg-light rounded">{medicine.custom_instructions}</p>
                            </div>
                          )}
                          
                          <div className="mt-3">
                            <strong className="text-muted">Side Effects:</strong>
                            <p className="small text-danger mb-0 mt-1">{medicine.side_effects}</p>
                          </div>
                          
                          {medicine.guide_pdf_data && medicine.guide_pdf_data.length > 0 && (
                            <div className="mt-3">
                              <button
                                className="btn btn-outline-primary btn-sm w-100"
                                onClick={() => downloadPrescriptionPDF(medicine.id, medicine.name)}
                              >
                                <i className="fas fa-file-pdf me-2"></i>View Medicine Guide
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {currentPrescription.additional_notes && (
                  <div className="mt-4">
                    <h6 className="text-primary">
                      <i className="fas fa-sticky-note me-2"></i>Additional Notes
                    </h6>
                    <div className="alert alert-light border-start border-primary border-4">
                      {currentPrescription.additional_notes}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-4 bg-warning bg-opacity-25 rounded">
                  <h6 className="text-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Important Safety Guidelines
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <ul className="small mb-0">
                        <li>Take medicines exactly as prescribed</li>
                        <li>Complete the full course even if you feel better</li>
                        <li>Don't share medicines with others</li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <ul className="small mb-0">
                        <li>Store medicines in a cool, dry place</li>
                        <li>Contact your doctor if you experience severe reactions</li>
                        <li>Keep this prescription record for your medical history</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription History Tab */}
      {activeTab === 'history' && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="fas fa-history me-2"></i>
                  Your Prescription History
                </h5>
              </div>
              <div className="card-body">
                {prescriptionHistory.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-prescription fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No Prescription History</h5>
                    <p className="text-muted">Access your first prescription to start building your medical history.</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setActiveTab('access')}
                    >
                      <i className="fas fa-key me-2"></i>Access Prescription
                    </button>
                  </div>
                ) : (
                  <div className="row">
                    {prescriptionHistory.map((prescription, index) => (
                      <div key={`history-${prescription.id}-${index}`} className="col-lg-6 mb-4">
                        <div className="card border h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div>
                                <h6 className="mb-1">Prescription #{prescription.id}</h6>
                                <small className="text-muted">
                                  {new Date(Number(prescription.created_at) / 1000000).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </small>
                              </div>
                              <div className="d-flex flex-column align-items-end">
                                <span className="badge bg-primary mb-1">
                                  {prescription.medicines?.length || 0} medicine{(prescription.medicines?.length || 0) !== 1 ? 's' : ''}
                                </span>
                                <span className="badge bg-success">
                                  Accessed
                                </span>
                              </div>
                            </div>
                            
                            <p className="mb-2">
                              <strong>Patient:</strong> {prescription.patient_name}
                            </p>
                            <p className="mb-3">
                              <strong>Doctor ID:</strong> <code className="small">{prescription.doctor_id}</code>
                            </p>
                            
                            {prescription.additional_notes && (
                              <p className="mb-3">
                                <strong>Notes:</strong> 
                                <span className="text-muted small d-block">{prescription.additional_notes}</span>
                              </p>
                            )}
                            
                            <button 
                              className="btn btn-outline-primary btn-sm w-100"
                              onClick={() => viewHistoryPrescription(prescription)}
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-eye me-2"></i>
                                  View Details
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {error && (
                  <div className="alert alert-danger mt-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDashboard;
