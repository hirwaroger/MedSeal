import { useState } from 'react';
import { useMedicine } from '../features/doctor/hooks/useMedicine';
import { usePrescription } from '../features/doctor/hooks/usePrescription';
import { useAuth } from '../hooks/useAuth';
import DashboardOverview from '../features/doctor/components/DashboardOverview';
import MedicineRepository from '../features/doctor/components/MedicineRepository';
import AddMedicineForm from '../features/doctor/components/AddMedicineForm';
import PrescriptionForm from '../features/doctor/components/PrescriptionForm';
import PrescriptionHistory from '../features/doctor/components/PrescriptionHistory';
import DoctorVerificationForm from './doctor/DoctorVerificationForm';
import AIChat from './AIChat';
import { useFavicon } from './useFavicon';

function DoctorDashboard({ user, showAlert }) {
  useFavicon('/favicon.png');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [guideDialog, setGuideDialog] = useState({ open: false, medicine: null });
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatContext, setAiChatContext] = useState(null);
  const [showAIWidget, setShowAIWidget] = useState(false);

  const { authenticatedActor } = useAuth();

  const {
    medicines,
    loading: medicineLoading,
    addMedicine,
    toggleMedicineStatus
  } = useMedicine(user, showAlert);

  const {
    prescriptions,
    selectedMedicines,
    loading: prescriptionLoading,
    createPrescription,
    addMedicineToSelection,
    removeMedicineFromSelection,
    updateSelectedMedicine
  } = usePrescription(user, showAlert);

  // Handle verification request submission
  const handleVerificationSubmit = async (verificationData) => {
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available');
      return;
    }

    try {
      const result = await authenticatedActor.submit_verification_request(verificationData);
      
      if ('Ok' in result) {
        showAlert('success', 'Verification request submitted successfully! You will be notified once reviewed.');
        setActiveTab('overview'); // Redirect to overview
      } else {
        showAlert('error', `Failed to submit verification request: ${result.Err}`);
      }
    } catch (error) {
      console.error('Error submitting verification request:', error);
      showAlert('error', `Error submitting verification request: ${error.message}`);
    }
  };

  const viewMedicineGuide = (medicine) => {
    setGuideDialog({ open: true, medicine });
  };

  const openAIAssistant = (context = null, mode = 'general') => {
    let aiContext;
    
    if (mode === 'medicine-recommendation') {
      // Special mode for medicine recommendations
      const medicinesText = medicines
        .filter(m => m.is_active)
        .map(m => `${m.name} (${m.dosage}): 
  - Frequency: ${m.frequency}
  - Duration: ${m.duration}  
  - Side Effects: ${m.side_effects}
  - Guide: ${m.guide_text ? m.guide_text.substring(0, 300) + '...' : 'No guide available'}`)
        .join('\n\n');
      
      aiContext = {
        medicines: medicinesText,
        prescription: context?.patientInfo || null,
        currentMedicines: context?.currentMedicines || null,
        notes: context?.notes || null,
        mode: 'medicine-recommendation'
      };
    } else if (mode === 'prescription' || context) {
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
      aiContext = {
        medicines: null,
        prescription: null
      };
    }
    
    setAiChatContext(aiContext);
    setShowAIChat(true);
  };

  const closeAIAssistant = () => {
    setShowAIChat(false);
    setAiChatContext(null);
  };

  // Enhanced sidebar items with verification status
  const getVerificationLabel = () => {
    if (!user.verification_status) return 'Request Verification';
    
    switch (user.verification_status) {
      case 'Pending': return 'Verification Pending';
      case 'Approved': return 'Verified ✓';
      case 'Rejected': return 'Verification Rejected';
      default: return 'Request Verification';
    }
  };

  const sidebarItems = [
    { id: 'overview', icon: '📊', label: 'Dashboard Overview' },
    { id: 'medicines', icon: '💊', label: `Medicine Repository (${medicines.length})` },
    { id: 'add-medicine', icon: '➕', label: 'Add New Medicine' },
    { id: 'prescriptions', icon: '📋', label: 'Create Prescription' },
    { id: 'history', icon: '📚', label: `Prescription History (${prescriptions.length})` },
    { 
      id: 'verification', 
      icon: user.verification_status === 'Approved' ? '✅' : user.verification_status === 'Pending' ? '⏳' : '🔍', 
      label: getVerificationLabel() 
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-gradient-to-br from-blue-600 to-blue-700 text-white flex flex-col transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-blue-500/30">
          <div className="flex items-center gap-3">
            {/* Replace emoji circle with favicon */}
            <img
              src="/favicon.png"
              alt="MedSeal"
              className="w-10 h-10 rounded-full bg-white/80 p-1 object-contain ring-2 ring-white/20"
              onError={(e)=>{e.currentTarget.style.display='none';}}
            />
            {!sidebarCollapsed && (
              <div>
                <h2 className="font-semibold">Dr. {user.name}</h2>
                <p className="text-sm text-blue-100">License: {user.license_number}</p>
                {user.verification_status && (
                  <p className={`text-xs mt-1 ${
                    user.verification_status === 'Approved' ? 'text-green-200' :
                    user.verification_status === 'Pending' ? 'text-yellow-200' :
                    user.verification_status === 'Rejected' ? 'text-red-200' :
                    'text-blue-200'
                  }`}>
                    {user.verification_status === 'Approved' ? '✅ Verified' :
                     user.verification_status === 'Pending' ? '⏳ Pending Verification' :
                     user.verification_status === 'Rejected' ? '❌ Verification Rejected' :
                     'Not Verified'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </div>
        
        {/* Toggle Button */}
        <div className="p-4 border-t border-blue-500/30">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full text-white hover:bg-white/20 rounded p-2 transition-colors"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      {activeTab === 'overview' && (
        <div className="flex-1 bg-gray-50 overflow-auto">
          {/* Verification status banner */}
          {user.verification_status !== 'Approved' && (
            <div className="mx-6 mt-6 mb-0">
              <div className={`rounded-lg border p-4 flex items-start gap-3 shadow-sm ${
                user.verification_status === 'Pending' ? 'bg-yellow-50 border-yellow-300' :
                user.verification_status === 'Rejected' ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'
              }`}>
                <span className="text-2xl">
                  {user.verification_status === 'Pending' ? '⏳' : user.verification_status === 'Rejected' ? '❌' : '🔍'}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {user.verification_status === 'Pending' && 'Your verification request is under review'}
                    {user.verification_status === 'Rejected' && 'Your verification request was rejected'}
                    {user.verification_status === 'NotRequired' && 'Verification not yet submitted'}
                  </h3>
                  {user.verification_status === 'Rejected' && user.verification_request && user.verification_request.admin_notes && (
                    <p className="text-sm text-red-700 mb-1">
                      Reason: {user.verification_request.admin_notes}
                    </p>
                  )}
                  {user.verification_status !== 'Pending' && user.verification_status !== 'Approved' && (
                    <button
                      onClick={() => setActiveTab('verification')}
                      className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
                    >
                      {user.verification_status === 'Rejected' ? 'Resubmit verification request →' : 'Submit verification request →'}
                    </button>
                  )}
                  {user.verification_status === 'Pending' && (
                    <p className="text-sm text-yellow-800">You will be notified once an admin processes your request.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DashboardOverview 
            user={user}
            medicines={medicines}
            prescriptions={prescriptions}
            onTabChange={setActiveTab}
            onOpenAI={openAIAssistant}
          />
        </div>
      )}
      
      {activeTab === 'medicines' && (
        <MedicineRepository 
          medicines={medicines}
          loading={medicineLoading}
          onTabChange={setActiveTab}
          onViewGuide={viewMedicineGuide}
          onAddToSelection={addMedicineToSelection}
          onToggleStatus={toggleMedicineStatus}
        />
      )}
      
      {activeTab === 'add-medicine' && (
        <AddMedicineForm 
          onSubmit={async (medicineData) => {
            console.log('LOG: DoctorDashboard - addMedicine called with:', medicineData);
            const result = await addMedicine(medicineData);
            console.log('LOG: DoctorDashboard - addMedicine result:', result);
            return result;
          }}
          onTabChange={setActiveTab}
          loading={medicineLoading}
          showAlert={showAlert}
        />
      )}
      
      {activeTab === 'prescriptions' && (
        <PrescriptionForm 
          medicines={medicines}
          selectedMedicines={selectedMedicines}
          onAddMedicine={addMedicineToSelection}
          onRemoveMedicine={removeMedicineFromSelection}
          onUpdateMedicine={updateSelectedMedicine}
          onSubmit={createPrescription}
          onOpenAI={openAIAssistant}
          loading={prescriptionLoading}
        />
      )}
      
      {activeTab === 'history' && (
        <PrescriptionHistory 
          prescriptions={prescriptions}
          onTabChange={setActiveTab}
          showAlert={showAlert}
        />
      )}

      {activeTab === 'verification' && (
        <div className="flex-1 bg-gray-50 overflow-auto">
          <DoctorVerificationForm
            user={user}
            onSubmit={handleVerificationSubmit}
            loading={medicineLoading || prescriptionLoading}
          />
        </div>
      )}

      {/* Medicine Guide Dialog */}
      {guideDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Medicine Guide - {guideDialog.medicine?.name}
              </h2>
            </div>
            <div className="p-6 flex-1 overflow-auto">
              <p className="text-sm text-gray-600 mb-4">
                <strong>Source:</strong> {guideDialog.medicine?.guide_source || 'Manual Entry'}
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto whitespace-pre-wrap font-mono text-sm">
                {guideDialog.medicine?.guide_text}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setGuideDialog({ open: false, medicine: null })}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Widget Toggle Button */}
      <button
        onClick={() => setShowAIWidget(!showAIWidget)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-30"
      >
        <span className="text-xl">🤖</span>
      </button>

      {/* AI Widget */}
      {showAIWidget && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span>🤖</span>
              </div>
              <div>
                <h3 className="font-semibold">AI Medical Assistant</h3>
                <p className="text-xs text-purple-100">Smart healthcare support</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAIWidget(false)}
              className="text-white hover:bg-white/20 rounded p-1"
            >
              <span>✕</span>
            </button>
          </div>
          <div className="p-4">
            <p className="text-gray-700 mb-4 text-sm">
              Get AI assistance for medical decisions, drug interactions, and patient care.
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => openAIAssistant(null, 'general')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <span>💬</span>
                General Medical Chat
              </button>
              <button 
                onClick={() => openAIAssistant({ medicines: medicines.filter(m => m.is_active) }, 'medicine')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <span>💊</span>
                Medicine Consultation
              </button>
              <button 
                onClick={() => openAIAssistant(null, 'medicine-recommendation')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <span>🎯</span>
                Medicine Recommendations
              </button>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                AI responses are advisory and should complement professional judgment
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChat
          userType="doctor"
          contextData={aiChatContext}
          onClose={closeAIAssistant}
          title={aiChatContext?.mode === 'medicine-recommendation' 
            ? "MedSeal AI - Medicine Recommendations" 
            : "MedSeal Health Partner - Medical Assistant"
          }
          initialMode={aiChatContext?.mode || "general"}
        />
      )}
    </div>
  );
}

export default DoctorDashboard;