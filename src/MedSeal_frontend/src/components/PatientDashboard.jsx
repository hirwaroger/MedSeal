import { useState } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

function PatientDashboard({ user }) {
  const [prescriptionId, setPrescriptionId] = useState('');
  const [prescriptionCode, setPrescriptionCode] = useState('');
  const [prescription, setPrescription] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccessPrescription = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPrescription(null);
    setMedicines([]);

    try {
      const result = await MedSeal_backend.get_prescription(prescriptionId, prescriptionCode);
      
      if ('Ok' in result) {
        setPrescription(result.Ok);
        
        // Load medicine details
        const medicinePromises = result.Ok.medicines.map(async (prescMed) => {
          const medicine = await MedSeal_backend.get_medicine(prescMed.medicine_id);
          return {
            ...medicine,
            custom_dosage: prescMed.custom_dosage[0] || null,
            custom_instructions: prescMed.custom_instructions
          };
        });
        
        const medicineDetails = await Promise.all(medicinePromises);
        setMedicines(medicineDetails.filter(m => m !== null));
      } else {
        setError(result.Err);
      }
    } catch (error) {
      setError('Error accessing prescription: ' + error.message);
    }
    setLoading(false);
  };

  const handleFullCodeInput = (value) => {
    // Handle input like "123456-789012" or just the full string
    if (value.includes('-')) {
      const [id, code] = value.split('-');
      setPrescriptionId(id);
      setPrescriptionCode(code);
    } else if (value.length === 13) { // Assume format: 6 digits + 6 digits + 1 dash
      const id = value.substring(0, 6);
      const code = value.substring(7);
      setPrescriptionId(id);
      setPrescriptionCode(code);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <i className="fas fa-user me-2"></i>
            Patient Dashboard
          </h2>
          
          <div className="row">
            <div className="col-md-8 mx-auto">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-search me-2"></i>
                    Access Your Prescription
                  </h5>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    Enter the Prescription ID and Code provided by your doctor to access your secure prescription.
                  </div>
                  
                  <form onSubmit={handleAccessPrescription}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="prescriptionId" className="form-label">
                            Prescription ID
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="prescriptionId"
                            value={prescriptionId}
                            onChange={(e) => setPrescriptionId(e.target.value)}
                            placeholder="e.g., 123456"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="prescriptionCode" className="form-label">
                            Secret Code
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="prescriptionCode"
                            value={prescriptionCode}
                            onChange={(e) => setPrescriptionCode(e.target.value)}
                            placeholder="e.g., 789012"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="fullCode" className="form-label">
                        Or paste full prescription code:
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="fullCode"
                        placeholder="e.g., 123456-789012"
                        onChange={(e) => handleFullCodeInput(e.target.value)}
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <span>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Accessing Prescription...
                        </span>
                      ) : (
                        <span>
                          <i className="fas fa-unlock me-2"></i>
                          Access Prescription
                        </span>
                      )}
                    </button>
                  </form>
                  
                  {error && (
                    <div className="alert alert-danger mt-3">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}
                </div>
              </div>
              
              {prescription && (
                <div className="card mt-4">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">
                      <i className="fas fa-prescription me-2"></i>
                      Your Prescription
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6><i className="fas fa-user me-2"></i>Patient Information</h6>
                        <p className="mb-1"><strong>Name:</strong> {prescription.patient_name}</p>
                        <p className="mb-1"><strong>Contact:</strong> {prescription.patient_contact}</p>
                        <p className="mb-0">
                          <strong>Prescribed:</strong> {' '}
                          {new Date(Number(prescription.created_at) / 1000000).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <h6><i className="fas fa-user-md me-2"></i>Prescription Details</h6>
                        <p className="mb-1"><strong>Prescription ID:</strong> {prescription.id}</p>
                        <p className="mb-1"><strong>Doctor ID:</strong> {prescription.doctor_id}</p>
                        {prescription.accessed_at && (
                          <p className="mb-0">
                            <strong>First Accessed:</strong> {' '}
                            {new Date(Number(prescription.accessed_at) / 1000000).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <h6><i className="fas fa-pills me-2"></i>Prescribed Medicines</h6>
                    <div className="row">
                      {medicines.map((medicine, index) => (
                        <div key={index} className="col-md-6 mb-3">
                          <div className="card border-start border-primary border-4">
                            <div className="card-body">
                              <h6 className="card-title text-primary">{medicine.name}</h6>
                              <div className="mb-2">
                                <strong>Dosage:</strong> {medicine.custom_dosage || medicine.dosage}
                              </div>
                              <div className="mb-2">
                                <strong>Frequency:</strong> {medicine.frequency}
                              </div>
                              <div className="mb-2">
                                <strong>Duration:</strong> {medicine.duration}
                              </div>
                              {medicine.custom_instructions && (
                                <div className="mb-2">
                                  <strong>Special Instructions:</strong>
                                  <p className="text-muted small mb-0">{medicine.custom_instructions}</p>
                                </div>
                              )}
                              <div className="mb-2">
                                <strong>Side Effects:</strong>
                                <p className="text-muted small mb-0">{medicine.side_effects}</p>
                              </div>
                              {medicine.guide_ipfs_hash && medicine.guide_ipfs_hash[0] && (
                                <div className="mt-2">
                                  <a 
                                    href={`https://ipfs.io/ipfs/${medicine.guide_ipfs_hash[0]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="fas fa-file-medical me-1"></i>
                                    View Guide
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {prescription.additional_notes && (
                      <div className="mt-4">
                        <h6><i className="fas fa-sticky-note me-2"></i>Additional Notes</h6>
                        <div className="alert alert-light">
                          {prescription.additional_notes}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 p-3 bg-light rounded">
                      <h6 className="text-warning">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Important Reminders
                      </h6>
                      <ul className="mb-0 small">
                        <li>Take medicines exactly as prescribed</li>
                        <li>Complete the full course even if you feel better</li>
                        <li>Contact your doctor if you experience severe side effects</li>
                        <li>Do not share your medicines with others</li>
                        <li>Store medicines in a cool, dry place</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;
