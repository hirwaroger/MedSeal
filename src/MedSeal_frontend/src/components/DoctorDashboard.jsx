import { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

function DoctorDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Medicine form state
  const [medicineForm, setMedicineForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    side_effects: '',
    guide_pdf_file: null
  });

  // Prescription form state
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient_name: '',
    patient_contact: '',
    medicines: [],
    additional_notes: ''
  });

  const [selectedMedicines, setSelectedMedicines] = useState([]);

  useEffect(() => {
    console.log('DoctorDashboard mounted, user:', user);
    loadMedicines();
    loadPrescriptions();
  }, [user]);

  const loadMedicines = async () => {
    console.log('Loading medicines for doctor:', user.id);
    setLoading(true);
    try {
      // Use the actual user ID, not the caller ID
      const result = await MedSeal_backend.get_doctor_medicines(user.id);
      console.log('Loaded medicines result:', result);
      setMedicines(result || []);
    } catch (error) {
      console.error('Error loading medicines:', error);
      alert('Error loading medicines: ' + error.message);
    }
    setLoading(false);
  };

  const loadPrescriptions = async () => {
    try {
      console.log('Loading prescriptions for doctor:', user.id);
      const result = await MedSeal_backend.get_doctor_prescriptions(user.id);
      console.log('Loaded prescriptions result:', result);
      setPrescriptions(result || []);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    console.log('Adding medicine with form data:', medicineForm);
    setLoading(true);
    try {
      let pdfData = null;
      let pdfName = null;
      
      if (medicineForm.guide_pdf_file) {
        console.log('Processing PDF file:', medicineForm.guide_pdf_file.name);
        pdfData = await fileToBytes(medicineForm.guide_pdf_file);
        pdfName = medicineForm.guide_pdf_file.name;
      }
      
      const medicineData = {
        name: medicineForm.name,
        dosage: medicineForm.dosage,
        frequency: medicineForm.frequency,
        duration: medicineForm.duration,
        side_effects: medicineForm.side_effects,
        guide_pdf_data: pdfData ? [pdfData] : [],
        guide_pdf_name: pdfName ? [pdfName] : []
      };
      
      console.log('Sending medicine data to backend:', medicineData);
      const result = await MedSeal_backend.add_medicine(medicineData);
      console.log('Add medicine result:', result);
      
      if ('Ok' in result) {
        console.log('Medicine added successfully:', result.Ok);
        setMedicineForm({
          name: '',
          dosage: '',
          frequency: '',
          duration: '',
          side_effects: '',
          guide_pdf_file: null
        });
        // Clear file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
        await loadMedicines(); // Reload medicines
        alert('Medicine added successfully!');
        setActiveTab('medicines'); // Switch to medicines tab to see the result
      } else {
        console.error('Error from backend:', result.Err);
        alert('Error: ' + result.Err);
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      alert('Error adding medicine: ' + error.message);
    }
    setLoading(false);
  };

  const fileToBytes = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result;
        const bytes = new Uint8Array(arrayBuffer);
        console.log('File converted to bytes, length:', bytes.length);
        resolve(bytes);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (selectedMedicines.length === 0) {
      alert('Please select at least one medicine');
      return;
    }

    setLoading(true);
    try {
      const prescriptionData = {
        patient_name: prescriptionForm.patient_name,
        patient_contact: prescriptionForm.patient_contact,
        medicines: selectedMedicines.map(med => ({
          medicine_id: med.id,
          custom_dosage: med.custom_dosage ? [med.custom_dosage] : [],
          custom_instructions: med.custom_instructions || ''
        })),
        additional_notes: prescriptionForm.additional_notes
      };

      console.log('Creating prescription with data:', prescriptionData);
      const result = await MedSeal_backend.create_prescription(prescriptionData);
      console.log('Prescription creation result:', result);
      
      if ('Ok' in result) {
        setPrescriptionForm({
          patient_name: '',
          patient_contact: '',
          medicines: [],
          additional_notes: ''
        });
        setSelectedMedicines([]);
        await loadPrescriptions();
        
        // Show success message with prescription code
        const prescriptionCode = result.Ok;
        alert(`Prescription created successfully!\n\nShare this code with your patient:\n${prescriptionCode}\n\nPatient can use this code to access their prescription securely.`);
        setActiveTab('history');
      } else {
        alert('Error: ' + result.Err);
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      if (error.message && error.message.includes('BigInt')) {
        alert('Data format error. Please try again.');
      } else {
        alert('Error creating prescription: ' + error.message);
      }
    }
    setLoading(false);
  };

  const toggleMedicineStatus = async (medicineId, currentStatus) => {
    try {
      const result = await MedSeal_backend.toggle_medicine_status(medicineId);
      if ('Ok' in result) {
        await loadMedicines(); // Reload medicines to update the display
        const newStatus = result.Ok.is_active;
        alert(`Medicine has been ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      } else {
        alert('Error: ' + result.Err);
      }
    } catch (error) {
      console.error('Error toggling medicine status:', error);
      alert('Error updating medicine status: ' + error.message);
    }
  };

  const downloadMedicinePDF = async (medicineId, medicineName) => {
    try {
      const pdfData = await MedSeal_backend.get_medicine_pdf(medicineId);
      if (pdfData && pdfData.length > 0) {
        const blob = new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${medicineName}_guide.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('No guide available for this medicine');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading guide: ' + error.message);
    }
  };

  const addMedicineToSelection = (medicine) => {
    if (!medicine.is_active) {
      alert('Cannot add inactive medicine to prescription');
      return;
    }
    
    if (!selectedMedicines.find(m => m.id === medicine.id)) {
      setSelectedMedicines([...selectedMedicines, {
        ...medicine,
        custom_dosage: '',
        custom_instructions: ''
      }]);
    }
  };

  const removeMedicineFromSelection = (medicineId) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.id !== medicineId));
  };

  const updateSelectedMedicine = (medicineId, field, value) => {
    setSelectedMedicines(selectedMedicines.map(m => 
      m.id === medicineId ? { ...m, [field]: value } : m
    ));
  };

  const sidebarItems = [
    { id: 'overview', icon: 'fas fa-chart-pie', label: 'Dashboard Overview' },
    { id: 'medicines', icon: 'fas fa-pills', label: `Medicine Repository (${medicines.length})` },
    { id: 'add-medicine', icon: 'fas fa-plus-circle', label: 'Add New Medicine' },
    { id: 'prescriptions', icon: 'fas fa-prescription', label: 'Create Prescription' },
    { id: 'history', icon: 'fas fa-history', label: `Prescription History (${prescriptions.length})` },
  ];

  const renderOverviewContent = () => (
    <div className="dashboard-content">
      <div className="content-header">
        <h1 className="content-title">Dashboard Overview</h1>
        <p className="content-subtitle">Welcome back, Dr. {user.name}</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-primary">
            <i className="fas fa-pills"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{medicines.length}</h3>
            <p className="stat-label">Total Medicines</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon bg-success">
            <i className="fas fa-prescription"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{prescriptions.length}</h3>
            <p className="stat-label">Prescriptions Created</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon bg-info">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{prescriptions.filter(p => p.accessed_at && p.accessed_at.length > 0).length}</h3>
            <p className="stat-label">Accessed Prescriptions</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon bg-warning">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{prescriptions.filter(p => !p.accessed_at || p.accessed_at.length === 0).length}</h3>
            <p className="stat-label">Pending Access</p>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-lg-8">
          <div className="modern-card">
            <div className="card-header">
              <h5><i className="fas fa-chart-line me-2"></i>Recent Activity</h5>
            </div>
            <div className="card-body">
              {prescriptions.slice(0, 5).map((prescription, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    <i className="fas fa-prescription text-primary"></i>
                  </div>
                  <div className="activity-content">
                    <h6 className="activity-title">Prescription #{prescription.id}</h6>
                    <p className="activity-desc">Created for {prescription.patient_name}</p>
                    <small className="activity-time">
                      {new Date(Number(prescription.created_at) / 1000000).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="activity-status">
                    <span className={`badge ${prescription.accessed_at && prescription.accessed_at.length > 0 ? 'bg-success' : 'bg-warning'}`}>
                      {prescription.accessed_at && prescription.accessed_at.length > 0 ? 'Accessed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
              {prescriptions.length === 0 && (
                <p className="text-muted text-center">No prescriptions created yet</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="modern-card">
            <div className="card-header">
              <h5><i className="fas fa-info-circle me-2"></i>Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="quick-actions">
                <button 
                  className="quick-action-btn"
                  onClick={() => setActiveTab('add-medicine')}
                >
                  <i className="fas fa-plus-circle"></i>
                  <span>Add Medicine</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => setActiveTab('prescriptions')}
                >
                  <i className="fas fa-prescription"></i>
                  <span>New Prescription</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => setActiveTab('medicines')}
                >
                  <i className="fas fa-pills"></i>
                  <span>View Medicines</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMedicinesContent = () => (
    <div className="dashboard-content">
      <div className="content-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="content-title">Medicine Repository</h1>
            <p className="content-subtitle">
              Manage your medicine library ({medicines.filter(m => m.is_active).length} active, {medicines.filter(m => !m.is_active).length} inactive)
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('add-medicine')}
          >
            <i className="fas fa-plus me-2"></i>Add New Medicine
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading medicines...</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-pills fa-4x text-muted mb-3"></i>
          <h4 className="text-muted">No Medicines Added</h4>
          <p className="text-muted">Start building your medicine repository</p>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('add-medicine')}
          >
            <i className="fas fa-plus me-2"></i>Add Your First Medicine
          </button>
        </div>
      ) : (
        <div className="medicines-grid">
          {medicines.map(medicine => (
            <div key={medicine.id} className={`medicine-card ${!medicine.is_active ? 'medicine-inactive' : ''}`}>
              <div className="medicine-header">
                <div className="d-flex align-items-center">
                  <h6 className="medicine-name me-2">{medicine.name}</h6>
                  <span className={`badge ${medicine.is_active ? 'bg-success' : 'bg-secondary'}`}>
                    {medicine.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="medicine-actions">
                  {medicine.guide_pdf_data && medicine.guide_pdf_data.length > 0 && (
                    <button 
                      className="btn btn-sm btn-outline-info me-1"
                      onClick={() => downloadMedicinePDF(medicine.id, medicine.name)}
                      title="Download Guide"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-outline-primary me-1"
                    onClick={() => addMedicineToSelection(medicine)}
                    title="Add to Prescription"
                    disabled={!medicine.is_active}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                  <button 
                    className={`btn btn-sm ${medicine.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                    onClick={() => toggleMedicineStatus(medicine.id, medicine.is_active)}
                    title={medicine.is_active ? 'Deactivate Medicine' : 'Activate Medicine'}
                  >
                    <i className={`fas ${medicine.is_active ? 'fa-pause' : 'fa-play'}`}></i>
                  </button>
                </div>
              </div>
              <div className="medicine-details">
                <div className="detail-item">
                  <span className="detail-label">Dosage:</span>
                  <span className="detail-value">{medicine.dosage}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Frequency:</span>
                  <span className="detail-value">{medicine.frequency}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{medicine.duration}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Side Effects:</span>
                  <span className="detail-value text-small">{medicine.side_effects}</span>
                </div>
              </div>
              <div className="medicine-footer">
                <small className="text-muted">
                  Added {new Date(Number(medicine.created_at) / 1000000).toLocaleDateString()}
                </small>
                <div className="d-flex align-items-center gap-2">
                  {medicine.guide_pdf_name && medicine.guide_pdf_name.length > 0 && (
                    <span className="badge bg-info">
                      <i className="fas fa-file-pdf me-1"></i>Guide Available
                    </span>
                  )}
                  {!medicine.is_active && (
                    <span className="badge bg-warning">
                      <i className="fas fa-pause me-1"></i>Deactivated
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Debug information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4">
          <div className="card">
            <div className="card-header">
              <h6>Debug Information</h6>
            </div>
            <div className="card-body">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Medicines Count:</strong> {medicines.length}</p>
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <details>
                <summary>Raw Medicines Data</summary>
                <pre>{JSON.stringify(medicines, null, 2)}</pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAddMedicineContent = () => (
    <div className="dashboard-content">
      <div className="content-header">
        <h1 className="content-title">Add New Medicine</h1>
        <p className="content-subtitle">Build your medicine repository</p>
      </div>
      
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="modern-card">
            <div className="card-header">
              <h5><i className="fas fa-plus-circle me-2"></i>Medicine Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleAddMedicine}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Medicine Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={medicineForm.name}
                        onChange={(e) => setMedicineForm({...medicineForm, name: e.target.value})}
                        placeholder="e.g., Paracetamol"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Dosage *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={medicineForm.dosage}
                        onChange={(e) => setMedicineForm({...medicineForm, dosage: e.target.value})}
                        placeholder="e.g., 500mg"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Frequency *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={medicineForm.frequency}
                        onChange={(e) => setMedicineForm({...medicineForm, frequency: e.target.value})}
                        placeholder="e.g., Twice daily"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Duration *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={medicineForm.duration}
                        onChange={(e) => setMedicineForm({...medicineForm, duration: e.target.value})}
                        placeholder="e.g., 7 days"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Side Effects *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={medicineForm.side_effects}
                    onChange={(e) => setMedicineForm({...medicineForm, side_effects: e.target.value})}
                    placeholder="List potential side effects..."
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Medicine Guide (PDF)</label>
                  <div className="file-upload-area">
                    <i className="fas fa-cloud-upload-alt upload-icon"></i>
                    <p className="mb-2">Drop your PDF file here or click to browse</p>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf"
                      onChange={(e) => setMedicineForm({...medicineForm, guide_pdf_file: e.target.files[0]})}
                    />
                    {medicineForm.guide_pdf_file && (
                      <p className="text-success mt-2">
                        <i className="fas fa-check me-2"></i>
                        {medicineForm.guide_pdf_file.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Adding Medicine...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus me-2"></i>
                        Add Medicine
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => setActiveTab('medicines')}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Back to Medicines
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrescriptionsContent = () => (
    <div className="dashboard-content">
      <div className="content-header">
        <h1 className="content-title">Create Prescription</h1>
        <p className="content-subtitle">Create new prescriptions for patients using active medicines</p>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="modern-card">
            <div className="card-header">
              <h5><i className="fas fa-user me-2"></i>Patient Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreatePrescription}>
                <div className="form-group">
                  <label className="form-label">Patient Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={prescriptionForm.patient_name}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, patient_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Patient Contact *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={prescriptionForm.patient_contact}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, patient_contact: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={prescriptionForm.additional_notes}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, additional_notes: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn btn-success" disabled={loading || selectedMedicines.length === 0}>
                  {loading ? 'Creating...' : 'Create Prescription'}
                </button>
              </form>
            </div>
          </div>
          
          {/* Available Active Medicines */}
          <div className="modern-card mt-3">
            <div className="card-header bg-info">
              <h5><i className="fas fa-pills me-2"></i>Available Active Medicines</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {medicines.filter(m => m.is_active).map(medicine => (
                  <div key={medicine.id} className="col-12 mb-2">
                    <div className="d-flex justify-content-between align-items-center p-2 border rounded">
                      <div>
                        <strong>{medicine.name}</strong>
                        <small className="text-muted d-block">{medicine.dosage} - {medicine.frequency}</small>
                      </div>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => addMedicineToSelection(medicine)}
                        disabled={selectedMedicines.find(m => m.id === medicine.id)}
                      >
                        {selectedMedicines.find(m => m.id === medicine.id) ? 'Added' : 'Add'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {medicines.filter(m => m.is_active).length === 0 && (
                <p className="text-muted">No active medicines available. Add medicines first.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="modern-card">
            <div className="card-header">
              <h5><i className="fas fa-list me-2"></i>Selected Medicines ({selectedMedicines.length})</h5>
            </div>
            <div className="card-body">
              {selectedMedicines.length === 0 ? (
                <p className="text-muted">No medicines selected. Add active medicines from the available list.</p>
              ) : (
                selectedMedicines.map(medicine => (
                  <div key={medicine.id} className="card mb-2">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6>{medicine.name}</h6>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeMedicineFromSelection(medicine.id)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <small className="text-muted">Default: {medicine.dosage} - {medicine.frequency}</small>
                      <div className="mt-2">
                        <input
                          type="text"
                          className="form-control form-control-sm mb-1"
                          placeholder="Custom dosage (optional)"
                          value={medicine.custom_dosage}
                          onChange={(e) => updateSelectedMedicine(medicine.id, 'custom_dosage', e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Custom instructions"
                          value={medicine.custom_instructions}
                          onChange={(e) => updateSelectedMedicine(medicine.id, 'custom_instructions', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryContent = () => (
    <div className="dashboard-content">
      <div className="content-header">
        <h1 className="content-title">Prescription History</h1>
        <p className="content-subtitle">View all created prescriptions ({prescriptions.length})</p>
      </div>
      
      <div className="modern-card">
        <div className="card-body">
          {prescriptions.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-prescription fa-4x text-muted mb-3"></i>
              <h4 className="text-muted">No Prescriptions Created</h4>
              <p className="text-muted">Start creating prescriptions for your patients</p>
              <button 
                className="btn btn-primary"
                onClick={() => setActiveTab('prescriptions')}
              >
                <i className="fas fa-plus me-2"></i>Create First Prescription
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Prescription Code</th>
                    <th>Patient Name</th>
                    <th>Contact</th>
                    <th>Medicines Count</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map(prescription => (
                    <tr key={prescription.id}>
                      <td>
                        <code className="text-primary">{prescription.id}-{prescription.prescription_code}</code>
                      </td>
                      <td>
                        <strong>{prescription.patient_name}</strong>
                      </td>
                      <td>{prescription.patient_contact}</td>
                      <td>
                        <span className="badge bg-info">
                          {prescription.medicines.length} medicine{prescription.medicines.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        {new Date(Number(prescription.created_at) / 1000000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <span className={`badge ${prescription.accessed_at && prescription.accessed_at.length > 0 ? 'bg-success' : 'bg-warning'}`}>
                          {prescription.accessed_at && prescription.accessed_at.length > 0 ? 'Accessed' : 'Pending'}
                        </span>
                        {prescription.accessed_at && prescription.accessed_at.length > 0 && (
                          <div className="text-muted small mt-1">
                            Accessed: {new Date(Number(prescription.accessed_at[0]) / 1000000).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            const fullCode = `${prescription.id}-${prescription.prescription_code}`;
                            navigator.clipboard.writeText(fullCode);
                            alert('Prescription code copied to clipboard!');
                          }}
                          title="Copy prescription code"
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="doctor-info">
            <div className="doctor-avatar">
              <i className="fas fa-user-md"></i>
            </div>
            {!sidebarCollapsed && (
              <div className="doctor-details">
                <h6 className="doctor-name">Dr. {user.name}</h6>
                <p className="doctor-license">License: {user.license_number}</p>
              </div>
            )}
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {[
            { id: 'overview', icon: 'fas fa-chart-pie', label: 'Dashboard Overview' },
            { id: 'medicines', icon: 'fas fa-pills', label: `Medicine Repository (${medicines.length})` },
            { id: 'add-medicine', icon: 'fas fa-plus-circle', label: 'Add New Medicine' },
            { id: 'prescriptions', icon: 'fas fa-prescription', label: 'Create Prescription' },
            { id: 'history', icon: 'fas fa-history', label: `Prescription History (${prescriptions.length})` },
          ].map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : ''}
            >
              <i className={item.icon}></i>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="sidebar-toggle">
          <button 
            className="toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <i className={`fas ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="dashboard-main">
        {activeTab === 'overview' && renderOverviewContent()}
        {activeTab === 'medicines' && renderMedicinesContent()}
        {activeTab === 'add-medicine' && renderAddMedicineContent()}
        {activeTab === 'prescriptions' && renderPrescriptionsContent()}
        {activeTab === 'history' && renderHistoryContent()}
      </div>
    </div>
  );
}

export default DoctorDashboard;
