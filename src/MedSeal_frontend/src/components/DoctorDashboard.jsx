import { useState, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

function DoctorDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('medicines');
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);

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
    loadMedicines();
    loadPrescriptions();
  }, []);

  const loadMedicines = async () => {
    try {
      const result = await MedSeal_backend.get_doctor_medicines(user.id);
      setMedicines(result);
    } catch (error) {
      console.error('Error loading medicines:', error);
    }
  };

  const loadPrescriptions = async () => {
    try {
      const result = await MedSeal_backend.get_doctor_prescriptions(user.id);
      setPrescriptions(result);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let pdfData = null;
      let pdfName = null;
      
      if (medicineForm.guide_pdf_file) {
        pdfData = await fileToBytes(medicineForm.guide_pdf_file);
        pdfName = medicineForm.guide_pdf_file.name;
      }
      
      const result = await MedSeal_backend.add_medicine({
        name: medicineForm.name,
        dosage: medicineForm.dosage,
        frequency: medicineForm.frequency,
        duration: medicineForm.duration,
        side_effects: medicineForm.side_effects,
        guide_pdf_data: pdfData ? [pdfData] : [],
        guide_pdf_name: pdfName ? [pdfName] : []
      });
      
      if ('Ok' in result) {
        setMedicineForm({
          name: '',
          dosage: '',
          frequency: '',
          duration: '',
          side_effects: '',
          guide_pdf_file: null
        });
        loadMedicines();
        alert('Medicine added successfully!');
      } else {
        alert('Error: ' + result.Err);
      }
    } catch (error) {
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
        ...prescriptionForm,
        medicines: selectedMedicines.map(med => ({
          medicine_id: med.id,
          custom_dosage: med.custom_dosage ? [med.custom_dosage] : [],
          custom_instructions: med.custom_instructions || ''
        }))
      };

      const result = await MedSeal_backend.create_prescription(prescriptionData);
      
      if ('Ok' in result) {
        setPrescriptionForm({
          patient_name: '',
          patient_contact: '',
          medicines: [],
          additional_notes: ''
        });
        setSelectedMedicines([]);
        loadPrescriptions();
        alert(`Prescription created! Share this with patient: ${result.Ok}`);
      } else {
        alert('Error: ' + result.Err);
      }
    } catch (error) {
      alert('Error creating prescription: ' + error.message);
    }
    setLoading(false);
  };

  const addMedicineToSelection = (medicine) => {
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

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <i className="fas fa-user-md me-2"></i>
            Doctor Dashboard
          </h2>
          
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'medicines' ? 'active' : ''}`}
                onClick={() => setActiveTab('medicines')}
              >
                <i className="fas fa-pills me-2"></i>
                Medicine Repository
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`}
                onClick={() => setActiveTab('prescriptions')}
              >
                <i className="fas fa-prescription me-2"></i>
                Create Prescription
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <i className="fas fa-history me-2"></i>
                Prescription History
              </button>
            </li>
          </ul>

          {/* Medicine Repository Tab */}
          {activeTab === 'medicines' && (
            <div className="row">
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <h5><i className="fas fa-plus me-2"></i>Add New Medicine</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleAddMedicine}>
                      <div className="mb-3">
                        <label className="form-label">Medicine Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={medicineForm.name}
                          onChange={(e) => setMedicineForm({...medicineForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Dosage</label>
                        <input
                          type="text"
                          className="form-control"
                          value={medicineForm.dosage}
                          onChange={(e) => setMedicineForm({...medicineForm, dosage: e.target.value})}
                          placeholder="e.g., 500mg"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Frequency</label>
                        <input
                          type="text"
                          className="form-control"
                          value={medicineForm.frequency}
                          onChange={(e) => setMedicineForm({...medicineForm, frequency: e.target.value})}
                          placeholder="e.g., Twice daily"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Duration</label>
                        <input
                          type="text"
                          className="form-control"
                          value={medicineForm.duration}
                          onChange={(e) => setMedicineForm({...medicineForm, duration: e.target.value})}
                          placeholder="e.g., 7 days"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Side Effects</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={medicineForm.side_effects}
                          onChange={(e) => setMedicineForm({...medicineForm, side_effects: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Guide PDF (Optional)</label>
                        <input
                          type="file"
                          className="form-control"
                          accept=".pdf"
                          onChange={(e) => setMedicineForm({...medicineForm, guide_pdf_file: e.target.files[0]})}
                        />
                        <div className="form-text">
                          <i className="fas fa-info-circle me-1"></i>
                          Upload a PDF guide for this medicine (optional)
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Medicine'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
              
              <div className="col-md-8">
                <div className="card">
                  <div className="card-header">
                    <h5><i className="fas fa-list me-2"></i>Your Medicines ({medicines.length})</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {medicines.map(medicine => (
                        <div key={medicine.id} className="col-md-6 mb-3">
                          <div className="card border">
                            <div className="card-body">
                              <h6 className="card-title">{medicine.name}</h6>
                              <p className="card-text small">
                                <strong>Dosage:</strong> {medicine.dosage}<br/>
                                <strong>Frequency:</strong> {medicine.frequency}<br/>
                                <strong>Duration:</strong> {medicine.duration}
                              </p>
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => addMedicineToSelection(medicine)}
                              >
                                <i className="fas fa-plus me-1"></i>
                                Add to Prescription
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Prescription Tab */}
          {activeTab === 'prescriptions' && (
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5><i className="fas fa-prescription me-2"></i>Patient Information</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleCreatePrescription}>
                      <div className="mb-3">
                        <label className="form-label">Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={prescriptionForm.patient_name}
                          onChange={(e) => setPrescriptionForm({...prescriptionForm, patient_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Patient Contact</label>
                        <input
                          type="text"
                          className="form-control"
                          value={prescriptionForm.patient_contact}
                          onChange={(e) => setPrescriptionForm({...prescriptionForm, patient_contact: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
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
              </div>
              
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5><i className="fas fa-pills me-2"></i>Selected Medicines ({selectedMedicines.length})</h5>
                  </div>
                  <div className="card-body">
                    {selectedMedicines.length === 0 ? (
                      <p className="text-muted">No medicines selected. Go to Medicine Repository to add medicines.</p>
                    ) : (
                      selectedMedicines.map(medicine => (
                        <div key={medicine.id} className="card mb-2 border-left-primary">
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
          )}

          {/* Prescription History Tab */}
          {activeTab === 'history' && (
            <div className="card">
              <div className="card-header">
                <h5><i className="fas fa-history me-2"></i>Prescription History ({prescriptions.length})</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Prescription ID</th>
                        <th>Patient Name</th>
                        <th>Medicines Count</th>
                        <th>Created</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.map(prescription => (
                        <tr key={prescription.id}>
                          <td>
                            <code>{prescription.id}-{prescription.prescription_code}</code>
                          </td>
                          <td>{prescription.patient_name}</td>
                          <td>
                            <span className="badge bg-info">
                              {prescription.medicines.length} medicines
                            </span>
                          </td>
                          <td>
                            {new Date(Number(prescription.created_at) / 1000000).toLocaleDateString()}
                          </td>
                          <td>
                            <span className={`badge ${prescription.accessed_at ? 'bg-success' : 'bg-warning'}`}>
                              {prescription.accessed_at ? 'Accessed' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;
