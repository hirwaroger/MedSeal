import { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';
import AIChat from './AIChat';
import WidgetChat from './WidgetChat';

function PatientDashboard({ user, showAlert }) {
  const [activeTab, setActiveTab] = useState('home');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [prescriptionCode, setPrescriptionCode] = useState('');
  const [currentPrescription, setCurrentPrescription] = useState(null);
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showHealthWidget, setShowHealthWidget] = useState(false);
  const [widgetChatMode, setWidgetChatMode] = useState(false); // Add missing state
  const [aiChatContext, setAiChatContext] = useState(null);

  // Load prescription history on component mount
  useEffect(() => {
    loadPrescriptionHistory();
  }, []);

  const loadPrescriptionHistory = () => {
    // Get prescription history from localStorage
    const history = JSON.parse(localStorage.getItem('prescriptionHistory') || '[]');
    setPrescriptionHistory(history);
  };

  const savePrescriptionToHistory = (prescription, medicines) => {
    const historyEntry = {
      id: prescription.id,
      prescription_code: prescription.prescription_code,
      patient_name: prescription.patient_name,
      created_at: prescription.created_at.toString(), // Convert BigInt to string
      accessed_at: prescription.accessed_at ? prescription.accessed_at.toString() : Date.now().toString(),
      medicines_count: medicines.length,
      doctor_notes: prescription.additional_notes,
      medicines: medicines.map(m => ({
        name: m.medicine?.name || 'Unknown',
        dosage: m.custom_dosage || m.medicine?.dosage || 'N/A',
        instructions: m.custom_instructions
      }))
    };

    // Get existing history
    const history = JSON.parse(localStorage.getItem('prescriptionHistory') || '[]');
    
    // Check if prescription already exists in history
    const existingIndex = history.findIndex(h => h.id === prescription.id);
    
    if (existingIndex >= 0) {
      // Update existing entry
      history[existingIndex] = historyEntry;
    } else {
      // Add new entry to beginning of array
      history.unshift(historyEntry);
    }

    // Keep only last 10 prescriptions
    const limitedHistory = history.slice(0, 10);
    
    localStorage.setItem('prescriptionHistory', JSON.stringify(limitedHistory));
    setPrescriptionHistory(limitedHistory);
  };

  const accessPrescription = async () => {
    if (!prescriptionId.trim() || !prescriptionCode.trim()) {
      showAlert('warning', 'Please enter both Prescription ID and Code');
      return;
    }
    setLoading(true);
    try {
      const result = await MedSeal_backend.get_prescription(prescriptionId.trim(), prescriptionCode.trim());
      
      console.log('[DEBUG] Access prescription result:', result);
      
      if ('Ok' in result) {
        const prescription = result.Ok;
        setCurrentPrescription(prescription);
        console.log('[DEBUG] Retrieved prescription:', prescription);
        console.log('[DEBUG] Prescription medicines:', prescription.medicines);
        
        // Fetch medicine details with improved error handling and retries
        const medicineDetails = await Promise.all(
          prescription.medicines.map(async (med, index) => {
            try {
              console.log(`[DEBUG] Fetching medicine ${index}: ID=${med.medicine_id}`);
              
              // Try to get medicine details
              const medicineResult = await MedSeal_backend.get_medicine(med.medicine_id);
              console.log(`[DEBUG] Medicine ${index} result:`, medicineResult);
              
              if (medicineResult && medicineResult.name) {
                console.log(`[DEBUG] Successfully retrieved medicine: ${medicineResult.name}`);
                return {
                  ...med,
                  medicine: medicineResult
                };
              } else {
                console.warn(`[DEBUG] Medicine not found for ID: ${med.medicine_id}, trying alternative approach`);
                
                // Try to get all medicines and find by ID (debug approach)
                try {
                  const allMedicines = await MedSeal_backend.get_all_medicines_debug();
                  console.log('[DEBUG] All medicines from debug endpoint:', allMedicines);
                  const foundMedicine = allMedicines.find(m => m.id === med.medicine_id);
                  
                  if (foundMedicine) {
                    console.log(`[DEBUG] Found medicine via debug endpoint: ${foundMedicine.name}`);
                    return {
                      ...med,
                      medicine: foundMedicine
                    };
                  }
                } catch (debugError) {
                  console.error('[DEBUG] Debug endpoint failed:', debugError);
                }
                
                // Return fallback with medicine ID visible
                return {
                  ...med,
                  medicine: { 
                    name: `Medicine (ID: ${med.medicine_id})`, 
                    dosage: 'Contact your doctor for details', 
                    frequency: 'As prescribed', 
                    duration: 'As prescribed', 
                    side_effects: 'Contact your doctor for details',
                    guide_text: 'No guide available - Contact your doctor'
                  }
                };
              }
            } catch (error) {
              console.error(`[DEBUG] Error fetching medicine for ID ${med.medicine_id}:`, error);
              return {
                ...med,
                medicine: { 
                  name: `Medicine (ID: ${med.medicine_id})`, 
                  dosage: 'Contact your doctor for details', 
                  frequency: 'As prescribed', 
                  duration: 'As prescribed', 
                  side_effects: 'Contact your doctor for details',
                  guide_text: 'No guide available - Contact your doctor'
                }
              };
            }
          })
        );
        
        console.log('[DEBUG] Final medicine details:', medicineDetails);
        
        // Validate that we have at least some medicine information
        const validMedicines = medicineDetails.filter(med => med.medicine && med.medicine.name);
        console.log(`[DEBUG] Valid medicines count: ${validMedicines.length} out of ${medicineDetails.length}`);
        
        setMedicines(medicineDetails);
        
        // Save to history with debug logging
        savePrescriptionToHistory(prescription, medicineDetails);
        console.log('[DEBUG] Prescription saved to history:', prescription, medicineDetails);
        
        setActiveTab('prescription');
        
        if (validMedicines.length < medicineDetails.length) {
          showAlert('warning', `Prescription accessed but some medicine details could not be loaded. Contact your doctor if needed.`);
        } else {
          showAlert('success', 'Prescription accessed successfully!');
        }
      } else {
        console.log('[DEBUG] Failed to access prescription:', result.Err);
        showAlert('error', 'Failed to access prescription: ' + result.Err);
      }
    } catch (error) {
      console.error('[DEBUG] Error accessing prescription:', error);
      showAlert('error', 'Error accessing prescription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPrescriptionFromHistory = (historyEntry) => {
    // Reconstruct prescription object from history
    const prescription = {
      id: historyEntry.id,
      prescription_code: historyEntry.prescription_code,
      patient_name: historyEntry.patient_name,
      patient_contact: '',
      created_at: historyEntry.created_at,
      accessed_at: historyEntry.accessed_at,
      additional_notes: historyEntry.doctor_notes,
      medicines: []
    };

    // Reconstruct medicines
    const medicineDetails = historyEntry.medicines.map((med, index) => ({
      medicine_id: `history_${index}`,
      custom_dosage: med.dosage === 'N/A' ? null : med.dosage,
      custom_instructions: med.instructions || '',
      medicine: {
        name: med.name,
        dosage: med.dosage,
        frequency: 'As prescribed',
        duration: 'As prescribed',
        side_effects: 'Consult your doctor'
      }
    }));

    setCurrentPrescription(prescription);
    setMedicines(medicineDetails);
    setActiveTab('prescription');
    showAlert('info', 'Prescription loaded from history');
  };

  const openAIAssistant = (specificContext = null, mode = 'general') => {
    let context;
    
    if (mode === 'prescription' && currentPrescription) {
      // Prescription mode - include detailed prescription and medicine data
      const prescriptionText = `Patient: ${currentPrescription.patient_name}
Created: ${formatDate(currentPrescription.created_at)}
Doctor Notes: ${currentPrescription.additional_notes || 'No additional notes'}

Prescribed Medicines:
${medicines.map(m => `- ${m.medicine?.name || 'Unknown'} (${m.custom_dosage || m.medicine?.dosage || 'N/A'})
  Instructions: ${m.custom_instructions || 'Take as prescribed'}
  Frequency: ${m.medicine?.frequency || 'N/A'}
  Duration: ${m.medicine?.duration || 'N/A'}
  Side Effects: ${m.medicine?.side_effects || 'N/A'}
  Guide: ${m.medicine?.guide_text ? m.medicine.guide_text.substring(0, 300) + '...' : 'No guide available'}`).join('\n\n')}`;
      
      context = {
        prescription: prescriptionText,
        medicines: null
      };
    } else if (specificContext) {
      // Specific context provided
      context = {
        prescription: specificContext.prescription || null,
        medicines: specificContext.medicines || null
      };
    } else {
      // General mode - no specific context
      context = {
        prescription: null,
        medicines: null
      };
    }
    
    console.log('Opening AI assistant with mode:', mode, 'and context:', context);
    setAiChatContext(context);
    setShowAIChat(true);
    setShowHealthWidget(false);
  };
  
  const openWidgetChat = (mode = 'general') => {
    let context;
    
    if (mode === 'prescription' && currentPrescription) {
      const prescriptionText = `Patient: ${currentPrescription.patient_name}
Medicines: ${medicines.map(m => `${m.medicine?.name || 'Unknown'} - ${m.custom_instructions || 'No instructions'}`).join(', ')}
Doctor Notes: ${currentPrescription.additional_notes || 'No additional notes'}`;
      
      context = {
        prescription: prescriptionText,
        medicines: null
      };
    } else {
      context = {
        prescription: null,
        medicines: null
      };
    }
    
    console.log('Opening widget chat with mode:', mode, 'and context:', context);
    setAiChatContext(context);
    setWidgetChatMode(true);
    setShowHealthWidget(true);
  };

  const closeAIAssistant = () => {
    console.log('Closing AI Assistant');
    setShowAIChat(false);
    setAiChatContext(null);
  };

  const toggleHealthWidget = () => {
    if (widgetChatMode) {
      setWidgetChatMode(false);
    }
    setShowHealthWidget(!showHealthWidget);
  };

  const formatDate = (timestamp) => {
    // Handle both string and BigInt timestamps
    const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : Number(timestamp);
    return new Date(numericTimestamp / 1000000).toLocaleString();
  };

  const formatDateShort = (timestamp) => {
    // Handle both string and BigInt timestamps
    const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : Number(timestamp);
    return new Date(numericTimestamp / 1000000).toLocaleDateString();
  };

  const renderHomeContent = () => (
    <div className="row">
      <div className="col-lg-8">
        <div className="modern-card mb-4">
          <div className="card-header">
            <h5><i className="fas fa-prescription me-2"></i>Access Your Prescription</h5>
          </div>
          <div className="card-body">
            <p className="text-muted mb-4">
              Enter your prescription details to view your medications and get personalized guidance.
            </p>
            
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Prescription ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={prescriptionId}
                  onChange={(e) => setPrescriptionId(e.target.value)}
                  placeholder="Enter 6-digit ID"
                  maxLength={6}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Verification Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={prescriptionCode}
                  onChange={(e) => setPrescriptionCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
            </div>
            
            <div className="d-flex gap-2 mt-4">
              <button
                className="btn btn-primary"
                onClick={accessPrescription}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Accessing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-unlock me-2"></i>
                    Access Prescription
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Prescription History */}
        {prescriptionHistory.length > 0 && (
          <div className="modern-card mb-4">
            <div className="card-header">
              <h5><i className="fas fa-history me-2"></i>Recent Prescriptions</h5>
            </div>
            <div className="card-body">
              <div className="prescription-history">
                {prescriptionHistory.map((entry, index) => (
                  <div key={entry.id} className="history-item" onClick={() => loadPrescriptionFromHistory(entry)}>
                    <div className="history-content">
                      <div className="history-header">
                        <h6 className="history-title">Prescription #{entry.id}</h6>
                        <span className="history-date">{formatDateShort(entry.created_at)}</span>
                      </div>
                      <div className="history-details">
                        <span className="medicines-count">
                          <i className="fas fa-pills me-1"></i>
                          {entry.medicines_count} medicine{entry.medicines_count !== 1 ? 's' : ''}
                        </span>
                        {entry.doctor_notes && (
                          <span className="has-notes">
                            <i className="fas fa-sticky-note me-1"></i>
                            Has notes
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="history-action">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* How to Use Guide */}
        <div className="modern-card">
          <div className="card-header bg-info">
            <h5><i className="fas fa-info-circle me-2"></i>How to Use MedSeal</h5>
          </div>
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-4 text-center">
                <div className="mb-3">
                  <i className="fas fa-prescription fa-3x text-primary"></i>
                </div>
                <h6>Access Prescription</h6>
                <p className="text-muted small">Enter your prescription ID and code provided by your doctor</p>
              </div>
              <div className="col-md-4 text-center">
                <div className="mb-3">
                  <i className="fas fa-pills fa-3x text-success"></i>
                </div>
                <h6>View Medications</h6>
                <p className="text-muted small">See detailed information about your prescribed medicines</p>
              </div>
              <div className="col-md-4 text-center">
                <div className="mb-3">
                  <i className="fas fa-robot fa-3x text-info"></i>
                </div>
                <h6>Get AI Help</h6>
                <p className="text-muted small">Ask our AI assistant about your medications anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        {/* Health Tips */}
        <div className="modern-card">
          <div className="card-header bg-success">
            <h5><i className="fas fa-lightbulb me-2"></i>Health Tips</h5>
          </div>
          <div className="card-body">
            <div className="health-tip mb-3 p-3 bg-light rounded">
              <h6 className="text-success"><i className="fas fa-clock me-1"></i> Take on Time</h6>
              <p className="small mb-0">Always take your medications at the prescribed times for best results.</p>
            </div>
            <div className="health-tip mb-3 p-3 bg-light rounded">
              <h6 className="text-info"><i className="fas fa-utensils me-1"></i> Food Interactions</h6>
              <p className="small mb-0">Some medicines work better with food, others on an empty stomach.</p>
            </div>
            <div className="health-tip p-3 bg-light rounded">
              <h6 className="text-warning"><i className="fas fa-exclamation-triangle me-1"></i> Side Effects</h6>
              <p className="small mb-0">Monitor for side effects and contact your doctor if you have concerns.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrescriptionContent = () => (
    <div className="row">
      <div className="col-12">
        {currentPrescription && (
          <>
            {/* Prescription Header */}
            <div className="modern-card mb-4">
              <div className="card-header">
                <h5><i className="fas fa-file-medical me-2"></i>Prescription Details</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="info-item mb-3">
                      <label className="text-muted small">Patient Name</label>
                      <div className="fw-bold">{currentPrescription.patient_name}</div>
                    </div>
                    <div className="info-item mb-3">
                      <label className="text-muted small">Contact</label>
                      <div>{currentPrescription.patient_contact || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="info-item mb-3">
                      <label className="text-muted small">Prescription ID</label>
                      <div className="fw-bold">{currentPrescription.id}</div>
                    </div>
                    <div className="info-item mb-3">
                      <label className="text-muted small">Created Date</label>
                      <div>{formatDate(currentPrescription.created_at)}</div>
                    </div>
                  </div>
                  {currentPrescription.additional_notes && (
                    <div className="col-12">
                      <div className="info-item">
                        <label className="text-muted small">Doctor's Notes</label>
                        <div className="alert alert-info">
                          <i className="fas fa-sticky-note me-2"></i>
                          {currentPrescription.additional_notes}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Medications */}
            <div className="modern-card">
              <div className="card-header">
                <h5><i className="fas fa-pills me-2"></i>Your Medications ({medicines.length})</h5>
              </div>
              <div className="card-body">
                {medicines.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="fas fa-pills fa-3x mb-3"></i>
                    <h5>No medications found</h5>
                    <p>This prescription doesn't contain any medications.</p>
                  </div>
                ) : (
                  <div className="row g-4">
                    {medicines.map((med, index) => (
                      <div key={index} className="col-lg-6">
                        <div className="medicine-card h-100">
                          <div className="medicine-header">
                            <h6 className="medicine-name">
                              <i className="fas fa-capsules me-2 text-primary"></i>
                              {med.medicine?.name || 'Unknown Medicine'}
                            </h6>
                          </div>
                          
                          <div className="medicine-details">
                            <div className="detail-row">
                              <span className="detail-label">Dosage:</span>
                              <span className="detail-value">
                                {med.custom_dosage || med.medicine?.dosage || 'N/A'}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Frequency:</span>
                              <span className="detail-value">{med.medicine?.frequency || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Duration:</span>
                              <span className="detail-value">{med.medicine?.duration || 'N/A'}</span>
                            </div>
                          </div>

                          {med.custom_instructions && (
                            <div className="medicine-instructions">
                              <label className="text-muted small">Special Instructions:</label>
                              <div className="alert alert-warning py-2">
                                <i className="fas fa-exclamation-circle me-1"></i>
                                {med.custom_instructions}
                              </div>
                            </div>
                          )}

                          {med.medicine?.side_effects && (
                            <div className="medicine-side-effects">
                              <label className="text-muted small">Possible Side Effects:</label>
                              <div className="text-muted small mt-1">
                                {med.medicine.side_effects}
                              </div>
                            </div>
                          )}

                          {/* Enhanced Guide Text Display */}
                          {med.medicine?.guide_text && med.medicine.guide_text !== 'No guide available' && (
                            <div className="medicine-guide mt-3">
                              <label className="text-muted small">Medicine Guide:</label>
                              <div className="guide-preview bg-light p-2 rounded">
                                <div className="guide-text-preview" style={{ maxHeight: '100px', overflow: 'hidden' }}>
                                  {med.medicine.guide_text.substring(0, 200)}
                                  {med.medicine.guide_text.length > 200 && '...'}
                                </div>
                                {med.medicine.guide_text.length > 200 && (
                                  <button 
                                    className="btn btn-sm btn-link p-0 mt-2"
                                    onClick={() => {
                                      // Create modal to show full guide text with proper backdrop
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
                                              <h5 class="modal-title">Medicine Guide - ${med.medicine.name}</h5>
                                              <button type="button" class="btn-close" aria-label="Close"></button>
                                            </div>
                                            <div class="modal-body">
                                              <div class="mb-3">
                                                <strong>Source:</strong> ${med.medicine.guide_source || 'Medical Database'}
                                              </div>
                                              <div class="guide-text" style="white-space: pre-wrap; max-height: 400px; overflow-y: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 0.9em; line-height: 1.5; background: #f8f9fa; padding: 15px; border-radius: 5px;">
                                                ${med.medicine.guide_text}
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
                                    }}
                                  >
                                    Read Full Guide
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="medicine-actions mt-3">
                            <button 
                              className="btn btn-outline-info btn-sm me-2"
                              onClick={() => openAIAssistant({
                                prescription: `Specific question about ${med.medicine?.name}: ${med.medicine?.side_effects || 'No side effects listed'}. Guide: ${med.medicine?.guide_text || 'No guide available'}`
                            }, 'prescription')}
                          >
                            <i className="fas fa-robot me-1"></i>
                            Ask AI About This
                          </button>
                          {med.medicine?.guide_text && med.medicine.guide_text !== 'No guide available' && (
                            <button 
                              className="btn btn-outline-success btn-sm"
                              onClick={() => {
                                showAlert('success', `Medicine Guide Available: Click "Read Full Guide" above to view complete information about ${med.medicine.name}.`);
                              }}
                            >
                              <i className="fas fa-book-medical me-1"></i>
                              Guide Available
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  </div>
  );

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="doctor-info">
            <div className="doctor-avatar">
              <i className="fas fa-user patient-avatar"></i>
            </div>
            <div className="doctor-details">
              <h6 className="doctor-name">{user.name}</h6>
              <p className="doctor-license">Patient Portal</p>
            </div>
          </div>
        </div>
        
        <div className="sidebar-nav">
          <button 
            className={`sidebar-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <i className="fas fa-home"></i>
            <span>Home</span>
          </button>
          
          <button 
            className={`sidebar-item ${activeTab === 'prescription' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescription')}
            disabled={!currentPrescription}
          >
            <i className="fas fa-prescription"></i>
            <span>My Prescription</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="dashboard-content">
          <div className="content-header">
            <h2 className="content-title">
              {activeTab === 'home' && 'Welcome to MedSeal'}
              {activeTab === 'prescription' && 'My Prescription'}
            </h2>
            <p className="content-subtitle">
              {activeTab === 'home' && 'Your secure digital health companion'}
              {activeTab === 'prescription' && 'View and manage your prescribed medications'}
            </p>
          </div>

          {activeTab === 'home' && renderHomeContent()}
          {activeTab === 'prescription' && renderPrescriptionContent()}
        </div>
      </div>

      {/* Health Partner Widget Toggle Button */}
      <button 
        className="health-widget-toggle"
        onClick={toggleHealthWidget}
        title="MedSeal Health Partner"
      >
        <i className="fas fa-robot"></i>
      </button>

      {/* Health Partner Widget */}
      {showHealthWidget && !widgetChatMode && (
        <div className="health-widget">
          <div className="health-widget-header">
            <div className="d-flex align-items-center">
              <div className="widget-avatar">
                <i className="fas fa-heart"></i>
              </div>
              <div className="ms-2">
                <h6 className="mb-0">Health Partner</h6>
                <small>AI Assistant</small>
              </div>
            </div>
            <button 
              className="btn btn-sm btn-outline-light"
              onClick={toggleHealthWidget}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="health-widget-body">
            <p className="small mb-3">
              Your AI health assistant is ready to help with medication questions.
            </p>
            <div className="d-grid gap-2">
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => openWidgetChat('general')}
              >
                <i className="fas fa-comments me-2"></i>
                General Chat
              </button>
              <button 
                className="btn btn-outline-info btn-sm"
                onClick={() => openAIAssistant(null, 'general')}
              >
                <i className="fas fa-expand me-2"></i>
                Full Chat
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  if (currentPrescription) {
                    openAIAssistant(null, 'prescription');
                  } else {
                    showAlert('warning', 'Please access a prescription first to use prescription mode.');
                  }
                }}
              >
                <i className="fas fa-pills me-2"></i>
                Prescription Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health Partner Widget Chat */}
      {showHealthWidget && widgetChatMode && (
        <WidgetChat
          userType="patient"
          contextData={aiChatContext}
          onClose={toggleHealthWidget}
          onExpand={() => {
            setWidgetChatMode(false);
            openAIAssistant();
          }}
          showAlert={showAlert}
        />
      )}

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChat
          userType="patient"
          contextData={aiChatContext}
          onClose={closeAIAssistant}
          title="MedSeal Health Partner - Your Health Guide"
          initialMode={currentPrescription ? 'prescription' : 'general'}
        />
      )}
    </div>
  );
}

export default PatientDashboard;