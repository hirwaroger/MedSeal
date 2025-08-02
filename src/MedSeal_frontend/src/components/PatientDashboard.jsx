import { useState } from 'react';
import { usePrescription } from '../features/patient/hooks/usePrescription';
import PrescriptionAccess from '../features/patient/components/PrescriptionAccess';
import PrescriptionHistory from '../features/patient/components/PrescriptionHistory';
import MedicationCard from '../features/patient/components/MedicationCard';
import HealthWidget from '../features/patient/components/HealthWidget';
import AIChat from './AIChat';
import WidgetChat from './WidgetChat';
import { sessionUtils } from '../utils/session';

function PatientDashboard({ user, showAlert }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showAIChat, setShowAIChat] = useState(false);
  const [showHealthWidget, setShowHealthWidget] = useState(false);
  const [widgetChatMode, setWidgetChatMode] = useState(false);
  const [aiChatContext, setAiChatContext] = useState(null);
  const [guideDialog, setGuideDialog] = useState({ open: false, medicine: null });
  const [expandedAccordions, setExpandedAccordions] = useState({});

  const {
    currentPrescription,
    prescriptionHistory,
    medicines,
    loading,
    accessPrescription,
    loadPrescriptionFromHistory
  } = usePrescription(showAlert);

  // Save current view to session when tab changes
  React.useEffect(() => {
    if (user) {
      sessionUtils.updateActivity();
      sessionUtils.saveSession(user, activeTab);
    }
  }, [activeTab, user]);

  // Load saved view from session on mount
  React.useEffect(() => {
    const session = sessionUtils.loadSession();
    if (session && session.currentView && session.currentView !== 'dashboard') {
      setActiveTab(session.currentView);
    }
  }, []);

  const handleAccessPrescription = async (prescriptionId, prescriptionCode) => {
    const success = await accessPrescription(prescriptionId, prescriptionCode);
    if (success) {
      setActiveTab('prescription');
      // Update session with new view
      if (user) {
        sessionUtils.saveSession(user, 'prescription');
      }
    }
  };

  const handleLoadFromHistory = (historyEntry) => {
    const success = loadPrescriptionFromHistory(historyEntry);
    if (success) {
      setActiveTab('prescription');
    }
  };

  const formatDate = (timestamp) => {
    const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : Number(timestamp);
    return new Date(numericTimestamp / 1000000).toLocaleString();
  };

  const formatDateShort = (timestamp) => {
    const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : Number(timestamp);
    return new Date(numericTimestamp / 1000000).toLocaleDateString();
  };

  const openAIAssistant = (specificContext = null, mode = 'general') => {
    let context;
    
    if (mode === 'prescription' && currentPrescription) {
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
      context = {
        prescription: specificContext.prescription || null,
        medicines: specificContext.medicines || null
      };
    } else {
      context = {
        prescription: null,
        medicines: null
      };
    }
    
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
    
    setAiChatContext(context);
    setWidgetChatMode(true);
    setShowHealthWidget(true);
  };

  const closeAIAssistant = () => {
    setShowAIChat(false);
    setAiChatContext(null);
  };

  const toggleHealthWidget = () => {
    if (widgetChatMode) {
      setWidgetChatMode(false);
    }
    setShowHealthWidget(!showHealthWidget);
  };

  const viewMedicineGuide = (medicine) => {
    setGuideDialog({ open: true, medicine });
  };

  const toggleAccordion = (medicineId) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [medicineId]: !prev[medicineId]
    }));
  };

  const sidebarItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'prescription', icon: '💊', label: 'My Prescription', disabled: !currentPrescription },
  ];

  const renderHomeContent = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <PrescriptionAccess 
              onAccessPrescription={handleAccessPrescription}
              loading={loading}
            />

            <PrescriptionHistory 
              history={prescriptionHistory}
              onLoadFromHistory={handleLoadFromHistory}
              formatDateShort={formatDateShort}
            />

            {/* How to Use Guide */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <h2 className="text-xl font-semibold text-gray-900">How to Use MedSeal</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📋</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Prescription</h3>
                    <p className="text-sm text-gray-600">
                      Enter your prescription ID and code provided by your doctor
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">💊</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">View Medications</h3>
                    <p className="text-sm text-gray-600">
                      See detailed information about your prescribed medicines
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Get AI Help</h3>
                    <p className="text-sm text-gray-600">
                      Ask our AI assistant about your medications anytime
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Health Tips */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏥</span>
                  <h2 className="text-xl font-semibold text-gray-900">Health Tips</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600">⏰</span>
                    <h3 className="font-semibold text-green-800">Take on Time</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Always take your medications at the prescribed times for best results.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600">🍽️</span>
                    <h3 className="font-semibold text-blue-800">Food Interactions</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Some medicines work better with food, others on an empty stomach.
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-600">⚠️</span>
                    <h3 className="font-semibold text-yellow-800">Side Effects</h3>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Monitor for side effects and contact your doctor if you have concerns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrescriptionContent = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {currentPrescription && (
          <div className="space-y-6">
            {/* Prescription Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <h2 className="text-xl font-semibold text-gray-900">Prescription Details</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Patient Name
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentPrescription.patient_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Contact
                      </label>
                      <p className="text-gray-900">
                        {currentPrescription.patient_contact || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Prescription ID
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentPrescription.id}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Created Date
                      </label>
                      <p className="text-gray-900">
                        {formatDate(currentPrescription.created_at)}
                      </p>
                    </div>
                  </div>
                  {currentPrescription.additional_notes && (
                    <div className="md:col-span-2">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600">📝</span>
                          <h3 className="font-semibold text-blue-900">Doctor's Notes</h3>
                        </div>
                        <p className="text-blue-800">
                          {currentPrescription.additional_notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Medications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💊</span>
                  <h2 className="text-xl font-semibold text-gray-900">Your Medications ({medicines.length})</h2>
                </div>
              </div>
              <div className="p-6">
                {medicines.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💊</div>
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                      No medications found
                    </h3>
                    <p className="text-gray-500">
                      This prescription doesn't contain any medications.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {medicines.map((med, index) => (
                      <MedicationCard
                        key={index}
                        medicine={med}
                        index={index}
                        onViewGuide={viewMedicineGuide}
                        onAskAI={openAIAssistant}
                        expandedAccordions={expandedAccordions}
                        onToggleAccordion={toggleAccordion}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-gradient-to-br from-blue-600 to-blue-700 text-white flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
            <div>
              <h2 className="font-semibold">{user.name}</h2>
              <p className="text-sm text-blue-100">Patient Portal</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-white/20 text-white'
                  : item.disabled
                  ? 'text-blue-200 cursor-not-allowed opacity-50'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'home' && renderHomeContent()}
      {activeTab === 'prescription' && renderPrescriptionContent()}

      {/* Health Partner Widget Toggle Button */}
      <button 
        onClick={toggleHealthWidget}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center z-50"
      >
        <span className="text-xl">🤖</span>
      </button>

      {/* Health Partner Widget */}
      {showHealthWidget && !widgetChatMode && (
        <HealthWidget
          onClose={toggleHealthWidget}
          onGeneralChat={() => openWidgetChat('general')}
          onFullChat={() => openAIAssistant(null, 'general')}
          onPrescriptionMode={() => openAIAssistant(null, 'prescription')}
          currentPrescription={currentPrescription}
          showAlert={showAlert}
        />
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
                <strong>Source:</strong> {guideDialog.medicine?.guide_source || 'Medical Database'}
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