import React, { useState } from 'react';
import { usePrescription } from '../features/patient/hooks/usePrescription';
import { useAuth } from '../hooks/useAuth';
import { sessionUtils } from '../utils/session';
import PrescriptionAccess from '../features/patient/components/PrescriptionAccess';
import PrescriptionHistory from '../features/patient/components/PrescriptionHistory';
import MedicationCard from '../features/patient/components/MedicationCard';
import HealthWidget from '../features/patient/components/HealthWidget';
import AIChat from './AIChat';

function PatientDashboard({ user, showAlert }) {
  const [activeTab, setActiveTab] = useState('access');
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatContext, setAiChatContext] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDoctorVideo, setShowDoctorVideo] = useState(false);
  const [currentVideoMessage, setCurrentVideoMessage] = useState(null);
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const [showHealthWidget, setShowHealthWidget] = useState(false);
  const [redirectedAfterClaim, setRedirectedAfterClaim] = React.useState(false);

  const { authenticatedActor } = useAuth();

  // Replace local prescription/medicines/history state with hook-provided state and functions
  const {
    loading,
    fetchPrescription,
    getMedicine,
    clearPrescription,
    prescription: hookPrescription,
    medicines: hookMedicines,
    prescriptionHistory: hookPrescriptionHistory,
    loadPrescriptionFromHistory
  } = usePrescription(showAlert);

  // Save current view to session when tab changes
  React.useEffect(() => {
    if (user) {
      // sessionUtils.updateActivity();
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

  // Sync hook prescription -> redirect to history (only first time after claim)
  React.useEffect(() => {
    if (hookPrescription && !redirectedAfterClaim) {
      setSelectedPrescription(hookPrescription);
      setRedirectedAfterClaim(true);
      // Put in history tab so user sees claimed entry
      setActiveTab('history');
      showAlert && showAlert('success', 'Prescription claimed and added to your history.');
      if (user) sessionUtils.saveSession(user, 'history');
    }
  }, [hookPrescription, redirectedAfterClaim, user, showAlert]);

  // Sync hook history into local UI (so PrescriptionHistory component shows it)
  React.useEffect(() => {
    // when backend/history changes, if currently viewing history keep it up-to-date
    // we simply rely on hookPrescriptionHistory in render
  }, [hookPrescriptionHistory]);

  // handleAccessPrescription no longer needed (fetch handled inside PrescriptionAccess via hook) but kept if used elsewhere:
  const handleAccessPrescription = async (prescriptionId, prescriptionCode) => {
    const success = await fetchPrescription(prescriptionId, prescriptionCode);
    if (success) {
      setRedirectedAfterClaim(false); // allow redirect logic to run
    } else {
      showAlert && showAlert('error', 'Failed to access prescription.');
    }
  };

  const handleLoadFromHistory = async (historyEntry) => {
    // Use the hook's load function so hook state is updated consistently
    const ok = await loadPrescriptionFromHistory(historyEntry);
    if (ok) {
      setSelectedPrescription(historyEntry.prescription_data);
      setActiveTab('prescription');
      showAlert('info', 'Prescription loaded from history');
      if (user) sessionUtils.saveSession(user, 'prescription');
    } else {
      showAlert('error', 'Failed to load prescription from history');
    }
  };

  // Robust timestamp -> ms conversion used for UI
  const toMilliseconds = (timestamp) => {
    if (timestamp == null) return null;
    // Arrays (some IC responses use opt as [value])
    if (Array.isArray(timestamp) && timestamp.length > 0) timestamp = timestamp[0];
    // BigInt
    if (typeof timestamp === 'bigint') {
      return Math.floor(Number(timestamp) / 1_000_000);
    }
    if (typeof timestamp === 'string') {
      const parsed = parseInt(timestamp, 10);
      if (isNaN(parsed)) return null;
      // if looks like nanoseconds (> 1e15) convert
      return parsed > 1e15 ? Math.floor(parsed / 1_000_000) : parsed;
    }
    if (typeof timestamp === 'number') {
      // nanoseconds from backend are > 1e15; milliseconds are ~1e12
      if (timestamp > 1e15) return Math.floor(timestamp / 1_000_000);
      // if seconds (very small) convert to ms
      if (timestamp < 1e12) return Math.floor(timestamp * 1000);
      return timestamp;
    }
    return null;
  };

  const formatDate = (timestamp) => {
    const ms = toMilliseconds(timestamp);
    if (!ms) return 'Invalid Date';
    const d = new Date(ms);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleString();
  };

  const formatDateShort = (timestamp) => {
    const ms = toMilliseconds(timestamp);
    if (!ms) return 'Invalid Date';
    const d = new Date(ms);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
  };

  const openAIAssistant = (specificContext = null, mode = 'general') => {
    let context;
    
    const prescriptionForContext = hookPrescription || selectedPrescription;
    
    if (mode === 'prescription' && prescriptionForContext) {
      const prescriptionText = `Patient: ${prescriptionForContext.patient_name}
Created: ${formatDate(prescriptionForContext.created_at)}
Doctor Notes: ${prescriptionForContext.additional_notes || 'No additional notes'}

Prescribed Medicines:
${(hookMedicines || []).map(m => `- ${m.medicine?.name || 'Unknown'} (${m.custom_dosage || m.medicine?.dosage || 'N/A'})
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
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available');
      return;
    }
    
    const userMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentMessage('');
    setIsTyping(true);
    
    try {
      let response;
      const context = {
        user_type: 'patient'
      };
      
      const prescriptionForChat = selectedPrescription || hookPrescription;
      
      if (activeTab === 'prescription' && prescriptionForChat) {
        // Get medicine details for context
        const medicineDetails = await Promise.all(
          prescriptionForChat.medicines.map(async (med) => {
            try {
              const medicine = await authenticatedActor.get_medicine(med.medicine_id);
              return medicine ? {
                ...medicine,
                custom_dosage: med.custom_dosage,
                custom_instructions: med.custom_instructions
              } : null;
            } catch (error) {
              console.error('Error fetching medicine:', error);
              return null;
            }
          })
        );
        
        const validMedicines = medicineDetails.filter(Boolean);
        const prescriptionData = {
          patient_name: prescriptionForChat.patient_name,
          additional_notes: prescriptionForChat.additional_notes,
          medicines: validMedicines
        };
        
        response = await authenticatedActor.chat_prescription(newMessages, {
          user_type: 'patient',
          prescription_data: JSON.stringify(prescriptionData)
        });
      } else {
        response = await authenticatedActor.chat_general(newMessages, context);
      }
      
      if ('Ok' in response) {
        const aiMessage = {
          role: 'assistant',
          content: response.Ok,
          timestamp: new Date().toISOString()
        };
        
        setMessages([...newMessages, aiMessage]);
        
        // Show doctor video for prescription mode responses
        if (activeTab === 'prescription' && prescriptionForChat) {
          setCurrentVideoMessage(aiMessage);
          setShowDoctorVideo(true);
          
          // Auto-hide video after 10 seconds
          setTimeout(() => {
            setShowDoctorVideo(false);
            setCurrentVideoMessage(null);
          }, 10000);
        }
      } else {
        throw new Error(response.Err);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const closeAIAssistant = () => {
    setShowAIChat(false);
    setAiChatContext(null);
  };

  const toggleAccordion = (key) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleViewGuide = (medicine) => {
    // Open guide in a modal or new window
    const guideWindow = window.open('', '_blank', 'width=800,height=600');
    guideWindow.document.write(`
      <html>
        <head><title>Medicine Guide - ${medicine.name}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>${medicine.name} - Complete Guide</h1>
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${medicine.guide_text}</pre>
        </body>
      </html>
    `);
  };

  const handleAskAI = (context) => {
    setAiChatContext(context);
    setShowAIChat(true);
  };

  const sidebarItems = [
    { id: 'access', icon: '📥', label: 'Access Prescription' },
    { id: 'history', icon: '📜', label: 'Prescription History' },
    { id: 'chat', icon: '💬', label: 'AI Chat' },
  ];

  // Do NOT auto add prescription tab unless claimed
  if (hookPrescription && !sidebarItems.find(i => i.id === 'prescription')) {
    const prescriptionTab = { id: 'prescription', icon: '💊', label: 'Current Prescription' };
    sidebarItems.splice(1, 0, prescriptionTab);
  }

  const renderAccessContent = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <PrescriptionAccess 
              onPrescriptionLoad={() => {
                setRedirectedAfterClaim(false); // ensure redirect/alert on next hookPrescription update
              }}
              showAlert={showAlert}
            />
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

  const renderHistoryContent = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <PrescriptionHistory 
          history={hookPrescriptionHistory || []}
          onLoadFromHistory={handleLoadFromHistory}
          formatDateShort={formatDateShort}
        />
      </div>
    </div>
  );

  const renderChatContent = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <h2 className="text-xl font-semibold text-gray-900">AI Chat</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-lg px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-xs rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-900 animate-pulse">
                    Typing...
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-20"
                placeholder="Ask something..."
              ></textarea>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Doctor Video Message */}
        {showDoctorVideo && currentVideoMessage && (
          <div className="mt-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎥</span>
                  <h2 className="text-xl font-semibold text-gray-900">Doctor's Video Message</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src={currentVideoMessage?.doctor_photo || '/default-doctor.png'} 
                      alt="Doctor"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">
                      {currentVideoMessage.timestamp}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {currentVideoMessage.role === 'assistant' ? 'Dr. MedSeal' : 'You'}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <video
                    src={currentVideoMessage.content}
                    controls
                    className="w-full rounded-lg border border-gray-200"
                  ></video>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPrescriptionContent = () => {
    // derive activePrescription and activeMedicines here and reuse throughout the render
    const activePrescription = hookPrescription || selectedPrescription;
    const activeMedicines = hookMedicines || [];

    if (!activePrescription) return null;

    return (
      <div className="flex-1 bg-gray-50 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Prescription Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Your Prescription</h1>
                    <p className="text-gray-600">Patient: {activePrescription.patient_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(activePrescription.created_at)}</p>
                </div>
              </div>
            </div>
            
            {activePrescription.additional_notes && (
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600">📝</span>
                    <h3 className="font-semibold text-blue-800">Doctor's Notes</h3>
                  </div>
                  <p className="text-blue-700">{activePrescription.additional_notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Medicines Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {activeMedicines.map((med, index) => (
              <MedicationCard
                key={`${med.medicine_id || med.id}-${index}`}
                medicine={med}
                index={index}
                onViewGuide={handleViewGuide}
                onAskAI={handleAskAI}
                expandedAccordions={expandedAccordions}
                onToggleAccordion={toggleAccordion}
              />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => openAIAssistant(null, 'prescription')}
                  className="flex items-center justify-center gap-2 p-4 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <span>🤖</span>
                  Ask AI About Prescription
                </button>
                <button
                  onClick={() => setShowHealthWidget(true)}
                  className="flex items-center justify-center gap-2 p-4 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <span>❤️</span>
                  Health Partner
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="flex items-center justify-center gap-2 p-4 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <span>💬</span>
                  General Chat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Health Widget */}
        {showHealthWidget && (
          <HealthWidget
            onClose={() => setShowHealthWidget(false)}
            onGeneralChat={() => {
              setShowHealthWidget(false);
              openAIAssistant();
            }}
            onFullChat={() => {
              setShowHealthWidget(false);
              setActiveTab('chat');
            }}
            onPrescriptionMode={() => {
              setShowHealthWidget(false);
              openAIAssistant(null, 'prescription');
            }}
            // pass the activePrescription here (was undefined currentPrescription)
            currentPrescription={activePrescription}
            showAlert={showAlert}
          />
        )}
      </div>
    );
  };

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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-white/20 text-white'
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
      {activeTab === 'access' && renderAccessContent()}
      {activeTab === 'prescription' && renderPrescriptionContent()}
      {activeTab === 'history' && renderHistoryContent()}
      {activeTab === 'chat' && renderChatContent()}

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChat
          userType="patient"
          contextData={aiChatContext}
          onClose={closeAIAssistant}
          title="MedSeal Health Partner - Your Health Guide"
          // set initialMode based on hook/selected prescription presence (was using undefined currentPrescription)
          initialMode={(hookPrescription || selectedPrescription) ? 'prescription' : 'general'}
        />
      )}
    </div>
  );
}

export default PatientDashboard;