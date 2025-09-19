import React, { useState, useEffect } from 'react';
import { usePrescription } from '../features/patient/hooks/usePrescription';
import { useAuth } from '../hooks/useAuth';
import { sessionUtils } from '../utils/session';
import PrescriptionAccess from '../features/patient/components/PrescriptionAccess';
import PrescriptionHistory from '../features/patient/components/PrescriptionHistory';
import MedicationCard from '../features/patient/components/MedicationCard';
import HealthWidget from '../features/patient/components/HealthWidget';
import AIChat from './AIChat';
import PatientCaseTracker from './patient/PatientCaseTracker';
import { useFavicon } from './useFavicon';
import PatientCaseSubmission from '../features/patient/components/PatientCaseSubmission';
import FAIcon from './FAIcon';
import FallbackView from '../shared/components/FallbackView';

function PatientDashboard({ user, showAlert }) {
  useFavicon('/favicon.png');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatContext, setAiChatContext] = useState(null);
  const [showHealthWidget, setShowHealthWidget] = useState(false);
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [guideDialog, setGuideDialog] = useState({ open: false, medicine: null });
  const [hasPrescription, setHasPrescription] = useState(false);
  const [redirectedAfterClaim, setRedirectedAfterClaim] = useState(false);
  
  // Add missing state variables for chat functionality
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDoctorVideo, setShowDoctorVideo] = useState(false);
  const [currentVideoMessage, setCurrentVideoMessage] = useState(null);
  
  const { authenticatedActor } = useAuth();

  const { 
    prescription, 
    medicines, 
    prescriptionHistory, 
    loading, 
    fetchPrescription, 
    loadPrescriptionFromHistory, 
    clearPrescription 
  } = usePrescription(showAlert);

  // Monitor prescription changes and update UI state
  useEffect(() => {
    console.log('LOG: PatientDashboard - prescription changed:', prescription);
    console.log('LOG: PatientDashboard - medicines changed:', medicines);
    
    if (prescription && medicines && medicines.length > 0) {
      console.log('LOG: Prescription and medicines loaded, updating UI state');
      setHasPrescription(true);
      setSelectedPrescription(prescription);
      // Switch to prescription tab to show the loaded prescription
      setActiveTab('prescription');
    } else if (prescription && (!medicines || medicines.length === 0)) {
      console.log('LOG: Prescription loaded but no medicines, keeping hasPrescription false');
      setHasPrescription(false);
      setSelectedPrescription(null);
    } else {
      console.log('LOG: No prescription data, resetting state');
      setHasPrescription(false);
      setSelectedPrescription(null);
    }
  }, [prescription, medicines]);

  // Handle prescription access success
  const handlePrescriptionLoad = (success) => {
    console.log('LOG: handlePrescriptionLoad called with success:', success);
    if (success) {
      // Force a small delay to ensure state updates are processed
      setTimeout(() => {
        console.log('LOG: Switching to prescription tab after successful load');
        setActiveTab('prescription');
      }, 100);
    }
  };

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
    if (prescription && !redirectedAfterClaim) {
      setSelectedPrescription(prescription);
      setRedirectedAfterClaim(true);
      // Put in history tab so user sees claimed entry
      setActiveTab('history');
      showAlert && showAlert('success', 'Prescription claimed and added to your history.');
      if (user) sessionUtils.saveSession(user, 'history');
    }
  }, [prescription, redirectedAfterClaim, user, showAlert]);

  // Sync hook history into local UI (so PrescriptionHistory component shows it)
  React.useEffect(() => {
    // when backend/history changes, if currently viewing history keep it up-to-date
    // we simply rely on prescriptionHistory in render
  }, [prescriptionHistory]);

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
    
    const prescriptionForContext = prescription || selectedPrescription;
    
    if (mode === 'prescription' && prescriptionForContext) {
      const prescriptionText = `Patient: ${prescriptionForContext.patient_name}
Created: ${formatDate(prescriptionForContext.created_at)}
Doctor Notes: ${prescriptionForContext.additional_notes || 'No additional notes'}

Prescribed Medicines:
${(medicines || []).map(m => `- ${m.medicine?.name || 'Unknown'} (${m.custom_dosage || m.medicine?.dosage || 'N/A'})
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
    
    console.log('LOG: Opening AI Chat with context:', context);
    setAiChatContext(context);
    setShowAIChat(true);
  };

  const sendMessage = async () => {
    // Check if function was called without proper setup
    if (typeof currentMessage === 'undefined') {
      console.error('Chat functionality not fully initialized');
      showAlert('error', 'Chat functionality not available. Please try again.');
      return;
    }
    
    if (!currentMessage.trim()) return;
    
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available. Please refresh the page and try again.');
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
      
      const prescriptionForChat = selectedPrescription || prescription;
      
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
        console.error('AI Chat Error Response:', response.Err);
        throw new Error(response.Err || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorMessage = 'Sorry, I encountered an error. ';
      
      if (error.message) {
        if (error.message.includes('Network')) {
          errorMessage += 'Please check your internet connection and try again.';
        } else if (error.message.includes('Authentication')) {
          errorMessage += 'Please refresh the page and try again.';
        } else if (error.message.includes('Invalid')) {
          errorMessage += 'There was a data format issue. Please try refreshing the page.';
        } else if (error.message.includes('not found')) {
          errorMessage += 'The requested information could not be found.';
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      } else {
        errorMessage += 'Please try again in a moment.';
      }
      
      const errorMessageObj = {
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages([...newMessages, errorMessageObj]);
      
      // Show alert for critical errors
      if (error.message && (error.message.includes('Authentication') || error.message.includes('Network'))) {
        showAlert('error', errorMessage);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const closeAIAssistant = () => {
    console.log('LOG: Closing AI Chat');
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
    { id: 'access', icon: <i className="fa-solid fa-inbox" aria-hidden="true" />, label: 'Access Prescription' },
    { id: 'history', icon: <i className="fa-solid fa-file-alt" aria-hidden="true" />, label: 'Prescription History' },
    { id: 'chat', icon: <i className="fa-solid fa-comments" aria-hidden="true" />, label: 'AI Chat' },
    { id: 'case_submission', icon: <i className="fa-solid fa-clipboard" aria-hidden="true" />, label: 'Submit Case' },
    { id: 'my_cases', icon: <i className="fa-solid fa-chart-bar" aria-hidden="true" />, label: 'My Cases' },
  ];
  // Do NOT auto add prescription tab unless claimed
  if (prescription && !sidebarItems.find(i => i.id === 'prescription')) {
    const prescriptionTab = { id: 'prescription', icon: <i className="fa-solid fa-pills" aria-hidden="true" />, label: 'Current Prescription' };
    sidebarItems.splice(1, 0, prescriptionTab);
  }


  const renderAccessContent = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <PrescriptionAccess 
              onPrescriptionLoad={handlePrescriptionLoad}
              showAlert={showAlert}
            />
          </div>

          <div className="space-y-6">
            {/* Health Tips */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl"><i className="fa-solid fa-hospital" aria-hidden="true" /></span>
                  <h2 className="text-xl font-semibold text-gray-900">Health Tips</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600"><i className="fa-solid fa-inbox" aria-hidden="true" /></span>
                    <h3 className="font-semibold text-green-800">Take on Time</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Always take your medications at the prescribed times for best results.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600"><i className="fa-solid fa-utensils" aria-hidden="true" /></span>
                    <h3 className="font-semibold text-blue-800">Food Interactions</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Some medicines work better with food, others on an empty stomach.
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-600"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /></span>
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


  const renderPrescriptionContent = () => {
    // derive activePrescription and activeMedicines here and reuse throughout the render
    const activePrescription = prescription || selectedPrescription;
    const activeMedicines = medicines || [];

    if (!activePrescription) {
      return (
        <div className="flex-1 bg-gray-50 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            <FallbackView
              icon="prescription-bottle"
              title="No Prescription Loaded" 
              message="Please access a prescription first to view your medications."
              actionText="Access Prescription"
              onAction={() => setActiveTab('access')}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-gray-50 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Prescription Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl"><i className="fa-solid fa-clipboard" aria-hidden="true" /></span>
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
                    <span className="text-blue-600"><i className="fa-solid fa-pen-to-square" aria-hidden="true" /></span>
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
                  <i className="fa-solid fa-robot" aria-hidden="true" />
                  Ask AI About Prescription
                </button>
                <button
                  onClick={() => setShowHealthWidget(true)}
                  className="flex items-center justify-center gap-2 p-4 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <i className="fa-solid fa-heart" aria-hidden="true" />
                  Health Partner
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="flex items-center justify-center gap-2 p-4 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <i className="fa-solid fa-comments" aria-hidden="true" />
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

  const renderCaseSubmissionContent = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <PatientCaseSubmission onSuccess={() => showAlert('success', 'Case submitted successfully!')} />
      </div>
    </div>
  );

  const renderMyCasesContent = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <PatientCaseTracker />
      </div>
    </div>
  );

  // Helper function to create a summary of the prescription for AI chat
  const createPrescriptionSummary = () => {
    const activePrescription = prescription || selectedPrescription;
    if (!activePrescription) return "";
    
    return `Prescription for ${activePrescription.patient_name}
    Created: ${formatDate(activePrescription.created_at)}
    Medicines: ${(medicines || []).length}
    Notes: ${activePrescription.additional_notes || 'No additional notes'}`;
  };

  // Improve renderHistoryContent to handle missing variables
  const renderHistoryContent = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {prescriptionHistory && prescriptionHistory.length > 0 ? (
          <PrescriptionHistory 
            history={prescriptionHistory}
            onLoadFromHistory={handleLoadFromHistory}
            formatDateShort={formatDateShort}
          />
        ) : (
          <FallbackView 
            icon="history"
            title="No Prescription History" 
            message="You haven't accessed any prescriptions yet. Access a prescription first to see it in your history."
            actionText="Access Prescription"
            onAction={() => setActiveTab('access')}
          />
        )}
      </div>
    </div>
  );

  // Improve renderChatContent to handle missing variables
  const renderChatContent = () => (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl"><i className="fa-solid fa-comments" aria-hidden="true" /></span>
              <h2 className="text-xl font-semibold text-gray-900">AI Chat</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {messages && messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FAIcon name="comments" className="text-4xl mb-2" />
                  <p>Start a conversation with the AI health assistant</p>
                </div>
              )}

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
                placeholder="Ask something about your health or medications..."
              ></textarea>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <span className="text-2xl"><i className="fa-solid fa-video" aria-hidden="true" /></span>
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

  // Improved tab content rendering with better error handling
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-gradient-to-br from-blue-600 to-blue-700 text-white flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-blue-500/30">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="MedSeal"
              className="w-10 h-10 rounded-full bg-white/80 p-1 object-contain ring-2 ring-white/30"
              onError={(e)=>{e.currentTarget.style.display='none';}}
            />
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
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/favicon.png"
                  alt="MedSeal"
                  className="w-10 h-10 rounded-full bg-blue-100 p-1 object-contain ring-2 ring-blue-200"
                  onError={(e)=>{e.currentTarget.style.display='none';}}
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Welcome, {user.name}</h1>
                  <p className="text-sm text-gray-600">Patient Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                hasPrescription ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {hasPrescription ? `✓ Prescription Loaded (${medicines?.length || 0} medicines)` : 'No Prescription'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'access'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Access Prescription
            </button>
            <button
              onClick={() => setActiveTab('prescription')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prescription'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              disabled={!hasPrescription}
            >
              My Prescription {hasPrescription && `(${medicines?.length || 0})`}
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Cases
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FAIcon name="pills" className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Active Prescription</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {hasPrescription ? medicines?.length || 0 : 0}
                      </p>
                      <p className="text-sm text-gray-600">
                        {hasPrescription ? 'Medicines loaded' : 'No prescription accessed'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FAIcon name="clock" className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">History</h3>
                      <p className="text-2xl font-bold text-green-600">{prescriptionHistory.length}</p>
                      <p className="text-sm text-gray-600">Previous prescriptions</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FAIcon name="robot" className="text-purple-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">AI Support</h3>
                      <p className="text-2xl font-bold text-purple-600">24/7</p>
                      <p className="text-sm text-gray-600">Health assistance</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('access')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <FAIcon name="plus" />
                      Access New Prescription
                    </button>
                    {hasPrescription && (
                      <button
                        onClick={() => setActiveTab('prescription')}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <FAIcon name="eye" />
                        View Current Prescription
                      </button>
                    )}
                    <button
                      onClick={() => openAIAssistant(null, 'general')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <FAIcon name="robot" />
                      Ask AI Health Partner
                    </button>
                  </div>
                </div>

                {/* Prescription History Preview */}
                {prescriptionHistory.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Prescriptions</h3>
                    <div className="space-y-3">
                      {prescriptionHistory.slice(0, 3).map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            loadPrescriptionFromHistory(entry);
                            setActiveTab('prescription');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <FAIcon name="pills" className="text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {entry.medicines_count} medicine{entry.medicines_count !== 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-gray-600">
                                {formatDateShort(entry.created_at)}
                              </p>
                            </div>
                          </div>
                          <FAIcon name="chevron-right" className="text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div className="p-6">
              <PrescriptionAccess 
                onPrescriptionLoad={handlePrescriptionLoad}
                showAlert={showAlert}
              />
            </div>
          )}

          {activeTab === 'prescription' && (
            <div className="p-6 space-y-6">
              {hasPrescription && (prescription || selectedPrescription) && medicines && medicines.length > 0 ? (
                <>
                  {/* Prescription Header */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FAIcon name="file-prescription" className="text-2xl text-blue-600" />
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">Your Prescription</h2>
                          <p className="text-gray-600">
                            Issued on {formatDate((prescription || selectedPrescription).created_at)}
                            {(prescription || selectedPrescription).accessed_at && (
                              <span className="ml-2 text-green-600">• Accessed on {formatDate((prescription || selectedPrescription).accessed_at)}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAIAssistant({ prescription: createPrescriptionSummary() }, 'prescription')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                          <FAIcon name="robot" />
                          Ask AI About This
                        </button>
                        <button
                          onClick={() => {
                            clearPrescription();
                            setActiveTab('overview');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Clear Prescription
                        </button>
                      </div>
                    </div>

                    {(prescription || selectedPrescription).additional_notes && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <FAIcon name="sticky-note" className="text-amber-600" />
                          <h4 className="font-semibold text-amber-800">Doctor's Notes</h4>
                        </div>
                        <p className="text-amber-700">{(prescription || selectedPrescription).additional_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Medicines List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Your Medications ({medicines.length})
                    </h3>
                    {medicines.map((medicine, index) => (
                      <MedicationCard
                        key={`${medicine.medicine_id || 'unknown'}_${index}`}
                        medicine={medicine}
                        index={index}
                        onViewGuide={handleViewGuide}
                        onAskAI={openAIAssistant}
                        expandedAccordions={expandedAccordions}
                        onToggleAccordion={toggleAccordion}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <FallbackView
                  icon="prescription-bottle"
                  title="No Prescription Loaded" 
                  message="Please access a prescription first to view your medications."
                  actionText="Access Prescription"
                  onAction={() => setActiveTab('access')}
                />
              )}
            </div>
          )}

          {activeTab === 'history' && renderHistoryContent()}
          {activeTab === 'chat' && renderChatContent()}
          {activeTab === 'case_submission' && renderCaseSubmissionContent()}
          {activeTab === 'my_cases' && renderMyCasesContent()}
        </div>
      </div>

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChat
          userType="patient"
          contextData={aiChatContext}
          onClose={closeAIAssistant}
          title="MedSeal Health Partner - Your Health Guide"
          initialMode={(prescription || selectedPrescription) ? 'prescription' : 'general'}
        />
      )}

      {/* AI Chat quick access button */}
      <button
        onClick={() => openAIAssistant(null, 'general')}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 z-30"
        title="Open AI Chat"
      >
        <FAIcon name="robot" className="text-xl" />
      </button>
    </div>
  );
}

export default PatientDashboard;