import { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';
import { extractTextFromPDF, isPDF, getFileSize } from '../utils/ocrUtils';
import AIChat from './AIChat';

function DoctorDashboard({ user, showAlert }) {
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
    guide_file: null,
    guide_text: '',
    extracting: false,
    extraction_progress: ''
  });

  // Prescription form state
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient_name: '',
    patient_contact: '',
    medicines: [],
    additional_notes: ''
  });

  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatContext, setAiChatContext] = useState(null);

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

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    if (!isPDF(file)) {
      showAlert('error', 'Please select a valid PDF file');
      return;
    }
    
    setMedicineForm(prev => ({
      ...prev,
      guide_file: file,
      extracting: true,
      extraction_progress: 'Starting OCR...'
    }));
    
    try {
      const extractedText = await extractTextFromPDF(file, (progress) => {
        setMedicineForm(prev => ({
          ...prev,
          extraction_progress: progress
        }));
      });
      
      setMedicineForm(prev => ({
        ...prev,
        guide_text: extractedText,
        extracting: false,
        extraction_progress: 'Text extracted successfully!'
      }));
      
      showAlert('success', 'PDF text extracted successfully!');
      
    } catch (error) {
      console.error('OCR extraction failed:', error);
      setMedicineForm(prev => ({
        ...prev,
        extracting: false,
        extraction_progress: 'Extraction failed'
      }));
      showAlert('error', 'Failed to extract text from PDF: ' + error.message);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const medicineData = {
        name: medicineForm.name,
        dosage: medicineForm.dosage,
        frequency: medicineForm.frequency,
        duration: medicineForm.duration,
        side_effects: medicineForm.side_effects,
        guide_text: medicineForm.guide_text || "No guide available", // Provide default for required field
        guide_source: medicineForm.guide_file ? medicineForm.guide_file.name : "Manual entry" // Provide default for required field
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
          guide_file: null,
          guide_text: '',
          extracting: false,
          extraction_progress: ''
        });
        
        // Clear file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
        await loadMedicines();
        showAlert('success', 'Medicine added successfully!');
        setActiveTab('medicines');
      } else {
        console.error('Error from backend:', result.Err);
        showAlert('error', 'Error: ' + result.Err);
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      showAlert('error', 'Error adding medicine: ' + error.message);
    }
    setLoading(false);
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (selectedMedicines.length === 0) {
      showAlert('warning', 'Please select at least one medicine');
      return;
    }
    setLoading(true);
    try {
      const prescriptionData = {
        patient_name: prescriptionForm.patient_name,
        patient_contact: prescriptionForm.patient_contact,
        medicines: selectedMedicines.map(med => ({
          medicine_id: med.id,
          // Use empty array [] for None, or array with string [value] for Some
          custom_dosage: med.custom_dosage && med.custom_dosage.trim() ? [med.custom_dosage.trim()] : [],
          custom_instructions: med.custom_instructions || ''
        })),
        additional_notes: prescriptionForm.additional_notes
      };
      
      console.log('[DEBUG] Creating prescription with data:', prescriptionData);
      console.log('[DEBUG] First medicine custom_dosage type:', typeof prescriptionData.medicines[0]?.custom_dosage);
      console.log('[DEBUG] First medicine custom_dosage value:', prescriptionData.medicines[0]?.custom_dosage);
      
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
        
        const prescriptionCode = result.Ok;
        showAlert('success', `Prescription created successfully! Share this code with your patient: ${prescriptionCode}`);
        setActiveTab('history');
      } else {
        showAlert('error', 'Error: ' + result.Err);
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      showAlert('error', 'Error creating prescription: ' + error.message);
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

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  const viewPrescriptionDetails = (prescription) => {
    // Implementation for viewing prescription details
    console.log('Viewing prescription:', prescription);
    // You can add a modal or detailed view here
  };

  const viewMedicineGuide = (medicine) => {
    if (medicine.guide_text) {
      // Create a modal or popup to show the guide text with proper backdrop
      const modal = document.createElement('div');
      modal.className = 'modal fade show';
      modal.style.display = 'block';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.zIndex = '1050';
      
      const closeModal = () => {
        modal.remove();
      };
      
      modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Medicine Guide - ${medicine.name}</h5>
              <button type="button" class="btn-close" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <strong>Source:</strong> ${medicine.guide_source || 'Manual Entry'}
              </div>
              <div class="guide-text" style="white-space: pre-wrap; max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 0.9em; background: #f8f9fa; padding: 15px; border-radius: 5px;">
                ${medicine.guide_text}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary close-modal-btn">Close</button>
            </div>
          </div>
        </div>
      `;
      
      // Add event listeners for closing
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
      
      modal.querySelector('.btn-close').addEventListener('click', closeModal);
      modal.querySelector('.close-modal-btn').addEventListener('click', closeModal);
      
      // Add escape key listener
      const escapeListener = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', escapeListener);
        }
      };
      document.addEventListener('keydown', escapeListener);
      
      document.body.appendChild(modal);
    }
  };

  const addMedicineToForm = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, {
        medicine_id: '',
        custom_dosage: '',
        custom_instructions: ''
      }]
    }));
  };

  const removeMedicineFromForm = (index) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const updateMedicineInForm = (index, field, value) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const validateMedicineForm = () => {
    const errors = [];
    if (!medicineForm.name.trim()) errors.push('Medicine name is required');
    if (!medicineForm.dosage.trim()) errors.push('Dosage is required');
    if (!medicineForm.frequency.trim()) errors.push('Frequency is required');
    if (!medicineForm.duration.trim()) errors.push('Duration is required');
    if (!medicineForm.side_effects.trim()) errors.push('Side effects information is required');
    return errors;
  };

  const renderOverviewContent = () => (
    <div className="dashboard-content">
      <div className="content-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="content-title mb-2">Welcome back, Dr. {user.name}</h1>
            <p className="content-subtitle text-muted">Here's what's happening with your practice today</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-primary"
              onClick={() => openAIAssistant(null, 'general')}
            >
              <i className="fas fa-robot me-2"></i>AI Assistant
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab('create-prescription')}
            >
              <i className="fas fa-plus me-2"></i>New Prescription
            </button>
          </div>
        </div>
      </div>
      
      <div className="stats-grid row g-4 mb-5">
        <div className="col-lg-3 col-md-6">
          <div className="stat-card modern-card h-100">
            <div className="stat-content p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h3 className="stat-number text-primary mb-1">{medicines.length}</h3>
                  <p className="stat-label text-muted mb-0">Total Medicines</p>
                </div>
                <div className="stat-icon">
                  <i className="fas fa-pills fa-2x text-primary opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6">
          <div className="stat-card modern-card h-100">
            <div className="stat-content p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h3 className="stat-number text-success mb-1">{prescriptions.length}</h3>
                  <p className="stat-label text-muted mb-0">Prescriptions Created</p>
                </div>
                <div className="stat-icon">
                  <i className="fas fa-prescription fa-2x text-success opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6">
          <div className="stat-card modern-card h-100">
            <div className="stat-content p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h3 className="stat-number text-info mb-1">{prescriptions.filter(p => p.accessed_at && p.accessed_at.length > 0).length}</h3>
                  <p className="stat-label text-muted mb-0">Accessed</p>
                </div>
                <div className="stat-icon">
                  <i className="fas fa-user-check fa-2x text-info opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6">
          <div className="stat-card modern-card h-100">
            <div className="stat-content p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h3 className="stat-number text-warning mb-1">{prescriptions.filter(p => !p.accessed_at || p.accessed_at.length === 0).length}</h3>
                  <p className="stat-label text-muted mb-0">Pending</p>
                </div>
                <div className="stat-icon">
                  <i className="fas fa-clock fa-2x text-warning opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="modern-card">
            <div className="card-header d-flex align-items-center justify-content-between p-4">
              <h5 className="mb-0"><i className="fas fa-chart-line me-2 text-primary"></i>Recent Activity</h5>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setActiveTab('prescriptions')}>
                View All
              </button>
            </div>
            <div className="card-body p-0">
              {prescriptions.slice(0, 5).map((prescription, index) => (
                <div key={index} className="activity-item d-flex align-items-center p-4 border-bottom">
                  <div className="activity-icon me-3">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-2">
                      <i className="fas fa-prescription text-primary"></i>
                    </div>
                  </div>
                  <div className="activity-content flex-grow-1">
                    <h6 className="activity-title mb-1">Prescription #{prescription.id}</h6>
                    <p className="activity-desc text-muted mb-1">Created for {prescription.patient_name}</p>
                    <small className="activity-time text-muted">
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
                <div className="text-center py-5">
                  <i className="fas fa-prescription fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">No prescriptions created yet</h6>
                  <p className="text-muted">Create your first prescription to see activity here</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="modern-card">
            <div className="card-header p-4">
              <h5 className="mb-0"><i className="fas fa-rocket me-2 text-success"></i>Quick Actions</h5>
            </div>
            <div className="card-body p-4">
              <div className="d-grid gap-3">
                <button 
                  className="btn btn-outline-primary d-flex align-items-center p-3"
                  onClick={() => setActiveTab('add-medicine')}
                >
                  <i className="fas fa-plus-circle me-3"></i>
                  <div className="text-start">
                    <div className="fw-semibold">Add Medicine</div>
                    <small className="text-muted">Build your repository</small>
                  </div>
                </button>
                <button 
                  className="btn btn-outline-success d-flex align-items-center p-3"
                  onClick={() => setActiveTab('create-prescription')}
                >
                  <i className="fas fa-prescription me-3"></i>
                  <div className="text-start">
                    <div className="fw-semibold">New Prescription</div>
                    <small className="text-muted">Create for patient</small>
                  </div>
                </button>
                <button 
                  className="btn btn-outline-info d-flex align-items-center p-3"
                  onClick={() => setActiveTab('medicines')}
                >
                  <i className="fas fa-pills me-3"></i>
                  <div className="text-start">
                    <div className="fw-semibold">View Medicines</div>
                    <small className="text-muted">Manage repository</small>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="modern-card mt-4">
            <div className="card-header p-4">
              <h5 className="mb-0"><i className="fas fa-lightbulb me-2 text-warning"></i>Tips</h5>
            </div>
            <div className="card-body p-4">
              <div className="tip-item mb-3">
                <div className="d-flex">
                  <i className="fas fa-file-pdf text-danger me-2 mt-1"></i>
                  <div>
                    <small className="fw-semibold">OCR Technology</small>
                    <div className="text-muted small">Upload PDF guides for automatic text extraction</div>
                  </div>
                </div>
              </div>
              <div className="tip-item">
                <div className="d-flex">
                  <i className="fas fa-robot text-primary me-2 mt-1"></i>
                  <div>
                    <small className="fw-semibold">AI Assistant</small>
                    <div className="text-muted small">Get help with prescriptions and medical questions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMedicinesContent = () => (
    <div className="dashboard-content">
      <div className="content-header mb-4">
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
          <p className="text-muted">Start building your medicine repository with OCR-powered guides</p>
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
                  {medicine.guide_text && (
                    <button 
                      className="btn btn-sm btn-outline-info me-1"
                      onClick={() => viewMedicineGuide(medicine)}
                      title="View Guide Text"
                    >
                      <i className="fas fa-eye"></i>
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
                  {medicine.guide_text && (
                    <span className="badge bg-info">
                      <i className="fas fa-file-text me-1"></i>Guide Available
                    </span>
                  )}
                  {medicine.guide_source && (
                    <span className="badge bg-secondary" title={`Source: ${medicine.guide_source}`}>
                      <i className="fas fa-file-pdf me-1"></i>OCR
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
      <div className="content-header mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="content-title">Add New Medicine</h1>
            <p className="content-subtitle">Build your medicine repository with OCR-powered guides</p>
          </div>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => setActiveTab('medicines')}
          >
            <i className="fas fa-arrow-left me-2"></i>Back to Medicines
          </button>
        </div>
      </div>
      
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="modern-card">
            <div className="card-header">
              <h5><i className="fas fa-plus-circle me-2"></i>Medicine Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const errors = validateMedicineForm();
                if (errors.length > 0) {
                  showAlert('error', errors.join(', '));
                  return;
                }
                handleAddMedicine(e);
              }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label fw-semibold">Medicine Name *</label>
                      <input
                        type="text"
                        className={`form-control ${!medicineForm.name.trim() ? 'is-invalid' : ''}`}
                        value={medicineForm.name}
                        onChange={(e) => setMedicineForm({...medicineForm, name: e.target.value})}
                        placeholder="e.g., Paracetamol"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label fw-semibold">Dosage *</label>
                      <input
                        type="text"
                        className={`form-control ${!medicineForm.dosage.trim() ? 'is-invalid' : ''}`}
                        value={medicineForm.dosage}
                        onChange={(e) => setMedicineForm({...medicineForm, dosage: e.target.value})}
                        placeholder="e.g., 500mg"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label fw-semibold">Frequency *</label>
                      <input
                        type="text"
                        className={`form-control ${!medicineForm.frequency.trim() ? 'is-invalid' : ''}`}
                        value={medicineForm.frequency}
                        onChange={(e) => setMedicineForm({...medicineForm, frequency: e.target.value})}
                        placeholder="e.g., Twice daily"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label fw-semibold">Duration *</label>
                      <input
                        type="text"
                        className={`form-control ${!medicineForm.duration.trim() ? 'is-invalid' : ''}`}
                        value={medicineForm.duration}
                        onChange={(e) => setMedicineForm({...medicineForm, duration: e.target.value})}
                        placeholder="e.g., 7 days"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label fw-semibold">Side Effects *</label>
                  <textarea
                    className={`form-control ${!medicineForm.side_effects.trim() ? 'is-invalid' : ''}`}
                    rows="3"
                    value={medicineForm.side_effects}
                    onChange={(e) => setMedicineForm({...medicineForm, side_effects: e.target.value})}
                    placeholder="List potential side effects..."
                    required
                  />
                </div>
                
                {/* Enhanced PDF upload section */}
                <div className="form-group">
                  <label className="form-label fw-semibold">Medicine Guide (PDF - Optional)</label>
                  <div className="file-upload-area border-2 border-dashed rounded p-4 text-center">
                    {!medicineForm.guide_file ? (
                      <>
                        <i className="fas fa-file-pdf fa-3x text-muted mb-3"></i>
                        <p className="mb-2">Drop your PDF file here or click to browse</p>
                        <p className="text-muted small">Maximum file size: 10MB</p>
                        <input
                          type="file"
                          className="form-control"
                          accept=".pdf"
                          onChange={(e) => handleFileUpload(e.target.files[0])}
                          disabled={medicineForm.extracting}
                        />
                      </>
                    ) : (
                      <div>
                        <div className="d-flex align-items-center justify-content-center mb-3">
                          <i className="fas fa-file-pdf text-danger me-2"></i>
                          <span className="fw-semibold">{medicineForm.guide_file.name}</span>
                          <span className="text-muted ms-2">({getFileSize(medicineForm.guide_file)})</span>
                          {!medicineForm.extracting && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger ms-3"
                              onClick={() => {
                                setMedicineForm(prev => ({
                                  ...prev,
                                  guide_file: null,
                                  guide_text: '',
                                  extraction_progress: ''
                                }));
                                const fileInput = document.querySelector('input[type="file"]');
                                if (fileInput) fileInput.value = '';
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </div>
                        
                        {medicineForm.extracting && (
                          <div className="alert alert-info">
                            <div className="d-flex align-items-center">
                              <div className="spinner-border spinner-border-sm me-3" role="status"></div>
                              <div>
                                <strong>Processing PDF...</strong>
                                <div className="small">{medicineForm.extraction_progress}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {medicineForm.guide_text && !medicineForm.extracting && (
                          <div className="alert alert-success">
                            <i className="fas fa-check-circle me-2"></i>
                            Text extracted successfully ({medicineForm.guide_text.length} characters)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Show extracted text preview */}
                {medicineForm.guide_text && (
                  <div className="form-group">
                    <label className="form-label fw-semibold">Extracted Guide Text (Preview & Edit)</label>
                    <textarea
                      className="form-control"
                      rows="8"
                      value={medicineForm.guide_text}
                      onChange={(e) => setMedicineForm({...medicineForm, guide_text: e.target.value})}
                      placeholder="Extracted text will appear here... You can edit if needed."
                      style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    />
                    <div className="form-text">
                      <i className="fas fa-info-circle me-1"></i>
                      You can edit the extracted text if needed before saving.
                    </div>
                  </div>
                )}
                
                <div className="d-flex gap-3 mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg" 
                    disabled={loading || medicineForm.extracting}
                  >
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
                    className="btn btn-outline-secondary btn-lg"
                    onClick={() => {
                      setMedicineForm({
                        name: '',
                        dosage: '',
                        frequency: '',
                        duration: '',
                        side_effects: '',
                        guide_file: null,
                        guide_text: '',
                        extracting: false,
                        extraction_progress: ''
                      });
                      const fileInput = document.querySelector('input[type="file"]');
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    <i className="fas fa-undo me-2"></i>
                    Clear Form
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
                            showAlert('success', 'Prescription code copied to clipboard!');
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

  const sidebarItems = [
    { id: 'overview', icon: 'fas fa-chart-pie', label: 'Dashboard Overview' },
    { id: 'medicines', icon: 'fas fa-pills', label: `Medicine Repository (${medicines.length})` },
    { id: 'add-medicine', icon: 'fas fa-plus-circle', label: 'Add New Medicine' },
    { id: 'prescriptions', icon: 'fas fa-prescription', label: 'Create Prescription' },
    { id: 'history', icon: 'fas fa-history', label: `Prescription History (${prescriptions.length})` },
  ];

  const toggleMedicineStatus = async (medicineId, currentStatus) => {
    try {
      const result = await MedSeal_backend.toggle_medicine_status(medicineId);
      if ('Ok' in result) {
        await loadMedicines();
        const newStatus = result.Ok.is_active;
        showAlert('success', `Medicine has been ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      } else {
        showAlert('error', 'Error: ' + result.Err);
      }
    } catch (error) {
      console.error('Error toggling medicine status:', error);
      showAlert('error', 'Error updating medicine status: ' + error.message);
    }
  };

  const downloadMedicinePDF = async (medicineId, medicineName) => {
    try {
      const pdfData = await MedSeal_backend.get_medicine_pdf(medicineId);
      if (pdfData && pdfData.length > 0) {
        const blob = new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Try multiple PDF viewing methods for better browser compatibility
        const viewPDF = () => {
          // Method 1: Try to open in new tab
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>${medicineName} Guide</title>
                <style>
                  body { margin: 0; padding: 0; height: 100vh; }
                  object, embed, iframe { width: 100%; height: 100%; border: none; }
                  .fallback { padding: 20px; text-align: center; font-family: Arial, sans-serif; }
                  .fallback a { display: inline-block; margin: 10px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
                </style>
              </head>
              <body>
                <object data="${url}" type="application/pdf">
                  <embed src="${url}" type="application/pdf">
                    <div class="fallback">
                      <h3>PDF Viewer</h3>
                      <p>Your browser doesn't support embedded PDFs.</p>
                      <a href="${url}" download="${medicineName}_guide.pdf">Download PDF</a>
                      <a href="${url}" target="_blank">Open in New Tab</a>
                    </div>
                  </embed>
                </object>
              </body>
              </html>
            `);
            newWindow.document.close();
          } else {
            // Method 2: If popup blocked, try direct navigation
            window.location.href = url;
          }
        };

        // Try to view the PDF
        try {
          viewPDF();
          showAlert('success', 'Medicine guide opened successfully');
        } catch (error) {
          console.error('Error viewing PDF:', error);
          // Method 3: Fallback to download
          const a = document.createElement('a');
          a.href = url;
          a.download = `${medicineName}_guide.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showAlert('info', 'PDF downloaded to your device');
        }
        
        // Clean up after a delay
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } else {
        showAlert('warning', 'No guide available for this medicine');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showAlert('error', 'Error downloading guide: ' + error.message);
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

  const openAIAssistant = (context = null, mode = 'general') => {
    let aiContext;
    
    if (mode === 'prescription' || context) {
      // Prescription mode - include medicine repository data
      const medicinesText = medicines
        .filter(m => m.is_active)
        .map(m => `${m.name} (${m.dosage}): 
  - Frequency: ${m.frequency}
  - Duration: ${m.duration}  
  - Side Effects: ${m.side_effects}
  - Guide: ${m.guide_text ? m.guide_text.substring(0, 500) + '...' : 'No guide available'}`)
        .join('\n\n');
      
      aiContext = {
        medicines: medicinesText,
        prescription: context?.prescription || null
      };
    } else {
      // General mode - no specific context
      aiContext = {
        medicines: null,
        prescription: null
      };
    }
    
    console.log('Opening AI assistant with mode:', mode, 'and context:', aiContext);
    setAiChatContext(aiContext);
    setShowAIChat(true);
  };

  const closeAIAssistant = () => {
    setShowAIChat(false);
    setAiChatContext(null);
  };

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
          {sidebarItems.map(item => (
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

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChat
          userType="doctor"
          contextData={aiChatContext}
          onClose={closeAIAssistant}
          title="MedSeal Health Partner - Medical Assistant"
          initialMode="general"
        />
      )}
    </div>
  );
}

export default DoctorDashboard;