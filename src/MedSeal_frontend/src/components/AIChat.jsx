import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

// Simple markdown parser for AI responses
const parseMarkdown = (text) => {
  if (!text) return text;
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-blue-700">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/^### (.*$)/gim, '<h5 class="text-lg font-bold text-blue-600 mt-3 mb-2">$1</h5>')
    .replace(/^## (.*$)/gim, '<h4 class="text-xl font-bold text-blue-600 mt-3 mb-2">$1</h4>')
    .replace(/^# (.*$)/gim, '<h3 class="text-2xl font-bold text-blue-600 mt-3 mb-2">$1</h3>')
    .replace(/^\- (.*$)/gim, '<li class="mb-1 ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="mb-1 ml-4 list-decimal">$2</li>')
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>');
};

function AIChat({ userType, contextData, onClose, title, initialMode = 'general' }) {
  const [chatMode, setChatMode] = useState(initialMode);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(true);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const { authenticatedActor } = useAuth();

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Initialize messages based on mode
  useEffect(() => {
    const initialMessage = getInitialMessage();
    setMessages([{
      role: 'assistant',
      content: initialMessage
    }]);
  }, [chatMode, userType]);

  useEffect(() => {
    if (initialMode === 'medicine-recommendation' && contextData) {
      const welcomeMessage = {
        role: 'assistant',
        content: `As your MedSeal AI Medical Assistant, I'm here to help you with medicine recommendations for your patient.

**Patient Information:**
${contextData.prescription || 'No patient info provided'}

**Current Selected Medicines:**
${contextData.currentMedicines || 'None selected yet'}

**Additional Notes:**
${contextData.notes || 'No additional notes'}

**Available Medicines in Your Repository:**
I have access to your ${contextData.medicines ? contextData.medicines.split('\n\n').length : 0} active medicines.

Please tell me:
1. What symptoms or conditions does the patient have?
2. Any allergies or contraindications?
3. Current medications they're taking?
4. Any specific treatment goals?

I can recommend appropriate medicines from your repository and suggest dosages, combinations, and precautions.`
      };
      
      setMessages([welcomeMessage]);
    }
  }, [initialMode, contextData]);

  const getInitialMessage = () => {
    if (chatMode === 'prescription') {
      return userType === 'doctor' 
        ? "Hello! I'm your **MedSeal Health Partner** in **Prescription Mode**. I can help you with:\n\n- Medicine-specific guidance from your repository\n- Detailed drug information from medicine guides\n- Clinical insights based on your stored medications\n- Patient counseling advice\n\nI'll use your medicine database and guides to provide detailed answers. What would you like to know?"
        : "Hi! I'm your **MedSeal Health Partner** in **Prescription Mode**. I can help you with:\n\n- Detailed information about your prescribed medications\n- Understanding medicine guides and instructions\n- Side effects and precautions specific to your medicines\n- Timing and food interactions\n\nI'll use your prescription data and medicine guides to give you personalized advice. What would you like to know about your medications?";
    } else {
      return userType === 'doctor' 
        ? "Hello! I'm your **MedSeal Health Partner** in **General Mode**. I can help you with:\n\n- General medical knowledge and guidelines\n- Drug interaction queries\n- Clinical best practices\n- General medication information\n\nI provide general medical guidance without accessing your specific medicine repository. How can I assist you?"
        : "Hi! I'm your **MedSeal Health Partner** in **General Mode**. I can help you with:\n\n- General health questions\n- Understanding medical terms\n- General medication information\n- Health tips and advice\n\nI provide general health guidance without accessing your specific prescription data. What would you like to know?";
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    if (!authenticatedActor) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Backend connection not available. Please refresh the page and try again.'
      }]);
      return;
    }

    const userMessage = {
      role: 'user',
      content: inputValue.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('Starting AI chat request...');
      console.log('User type:', userType);
      console.log('Chat mode:', chatMode);
      console.log('Context data:', contextData);

      const chatMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      chatMessages.push(userMessage);

      let result;

      if (chatMode === 'prescription') {
        if (userType === 'patient' && contextData?.prescription) {
          const context = {
            user_type: userType,
            prescription_data: contextData.prescription
          };
          console.log('Calling chat_prescription with context:', context);
          result = await authenticatedActor.chat_prescription(chatMessages, context);
        } else if (userType === 'doctor' && contextData?.medicines) {
          const context = {
            user_type: userType,
            medicine_data: contextData.medicines
          };
          console.log('Calling chat_medicine with context:', context);
          result = await authenticatedActor.chat_medicine(chatMessages, context);
        } else {
          const context = {
            user_type: userType
          };
          console.log('Calling chat_general (fallback) with context:', context);
          result = await authenticatedActor.chat_general(chatMessages, context);
        }
      } else {
        const context = {
          user_type: userType
        };
        console.log('Calling chat_general with context:', context);
        result = await authenticatedActor.chat_general(chatMessages, context);
      }
      
      console.log('AI response received:', result);
      
      if (result && typeof result === 'object' && 'Ok' in result) {
        console.log('Success response:', result.Ok);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.Ok
        }]);
      } else if (result && typeof result === 'object' && 'Err' in result) {
        console.error('Backend error response:', result.Err);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I apologize, but I encountered an error: ' + result.Err + '. Please try again.'
        }]);
      } else if (typeof result === 'string') {
        console.log('Direct string response:', result);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result
        }]);
      } else {
        console.error('Unexpected response format:', result);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I received an unexpected response format. Please try again.'
        }]);
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      let errorMessage = 'I\'m sorry, I\'m having trouble connecting right now. ';
      
      if (error.message && error.message.includes('Invalid record')) {
        errorMessage = 'Data format error. Please try refreshing the page and try again.';
      } else if (error.message && error.message.includes('not a function')) {
        errorMessage = 'AI assistant is temporarily unavailable. Please try again later.';
      } else if (error.message && error.message.includes('Network')) {
        errorMessage = 'Network connection issue. Please check your connection and try again.';
      } else if (error.message && error.message.includes('User not found')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      } else if (error.message) {
        errorMessage += 'Error: ' + error.message + ' Please try again in a moment.';
      } else {
        errorMessage += 'Please try again in a moment.';
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // New helper: copy visible chat transcript to clipboard
  const copyTranscript = async () => {
    try {
      const text = messages.map(m => `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`).join('\n\n');
      await navigator.clipboard.writeText(text);
      // lightweight feedback via assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: 'Chat transcript copied to clipboard.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to copy transcript.' }]);
    }
  };
  
  // Clear chat messages (keep initial assistant welcome)
  const clearChat = () => {
    const initialMessage = getInitialMessage();
    setMessages([{ role: 'assistant', content: initialMessage }]);
  };
  
  const quickQuestions = {
    general: {
      doctor: [
        "What are common drug interactions?",
        "Explain dosage guidelines",
        "General side effects to monitor",
        "Clinical best practices"
      ],
      patient: [
        "General medication safety tips",
        "How to read medicine labels",
        "When to contact doctor",
        "General health advice"
      ]
    },
    prescription: {
      doctor: [
        "Tell me about my stored medicines",
        "Medicine guide information",
        "Specific drug interactions in my repository",
        "Patient counseling for my medicines"
      ],
      patient: [
        "Explain my prescribed medications",
        "Side effects of my medicines",
        "How to take my medications properly",
        "What if I miss a dose of my medicine"
      ]
    }
  };

  const currentQuickQuestions = quickQuestions[chatMode][userType] || quickQuestions.general[userType];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Chat area */}
        <div className="flex-1 lg:w-2/3 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-white to-white/80 shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white text-sm sm:text-lg font-bold shadow-md">
                {userType === 'doctor' ? 'Dr' : 'HP'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">{title || 'MedSeal Health Partner'}</h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {userType === 'doctor' ? 'Medical Assistant' : 'Health Guide'} • {chatMode === 'prescription' ? 'Prescription Mode' : 'General Mode'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              <button onClick={copyTranscript} className="hidden sm:block text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border border-gray-200 hover:bg-gray-50">Copy</button>
              <button onClick={clearChat} className="hidden sm:block text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border border-gray-200 hover:bg-gray-50">Clear</button>
              <button onClick={() => setShowContextPanel(s => !s)} className="hidden lg:block text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border border-gray-200 hover:bg-gray-50">
                {showContextPanel ? 'Hide' : 'Show'}
              </button>
              <button onClick={onClose} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-gray-50 to-white min-h-0" ref={chatBoxRef}>
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[78%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow ${message.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-sky-500 text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }} />
                    ) : (
                      <p className="text-sm sm:text-base">{message.content}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 sm:mt-2">{formatTime(new Date())}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                </div>
                <div className="bg-white border border-gray-100 p-2 sm:p-3 rounded-lg shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick questions row */}
          <div className="px-3 sm:px-6 py-2 sm:py-3 border-t border-gray-100 bg-white flex items-center justify-between gap-2 sm:gap-4 shrink-0">
            <div className="flex flex-wrap gap-1 sm:gap-2 flex-1 min-w-0">
              {currentQuickQuestions.slice(0, 2).map((q, i) => (
                <button key={i} onClick={() => handleQuickQuestion(q)} disabled={isLoading} className="text-xs px-2 py-1 sm:px-3 sm:py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition truncate">
                  {q.length > 25 ? q.substring(0, 25) + '...' : q}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400 shrink-0">
              <span className="hidden sm:inline">Mode: </span>
              <span className="font-medium text-gray-700 ml-1">{chatMode}</span>
            </div>
          </div>

          {/* Input Footer */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 bg-white border-t border-gray-100 shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-3 py-2">
                <input 
                  ref={inputRef} 
                  type="text" 
                  placeholder="Ask MedSeal Health Partner..." 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)} 
                  disabled={isLoading} 
                  className="flex-1 bg-transparent outline-none text-sm min-w-0" 
                />
                <button type="button" onClick={() => setInputValue('')} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <button type="submit" disabled={isLoading || !inputValue.trim()} className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 shrink-0">
                {isLoading ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                ) : (
                  <span className="text-sm">Send</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Context panel */}
        {showContextPanel && (
          <aside className="w-full lg:w-1/3 border-t lg:border-t-0 lg:border-l border-gray-100 bg-gray-50 p-3 sm:p-6 overflow-auto max-h-60 lg:max-h-none">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Context</h4>
              <button onClick={() => setShowContextPanel(false)} className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">Close</button>
            </div>

            {/* Show prescription or medicines summary */}
            {chatMode === 'prescription' && contextData?.prescription && (
              <div className="mb-4">
                <h5 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Prescription Summary</h5>
                <div className="bg-white rounded-lg border border-gray-100 p-2 sm:p-3 text-xs sm:text-sm text-gray-700 max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs font-mono">{contextData.prescription}</pre>
                </div>
              </div>
            )}

            {chatMode === 'prescription' && contextData?.medicines && (
              <div className="mb-4">
                <h5 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Medicines</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {contextData.medicines.split('\n').slice(0,10).map((line, i) => (
                    <div key={i} className="text-xs sm:text-sm bg-white border border-gray-100 rounded p-2">{line}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Helpful tips */}
            <div className="mt-2">
              <h5 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Tips</h5>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2">
                <li>• Be specific for better answers.</li>
                <li>• Use prescription mode to get medicine-specific guidance.</li>
                <li>• Copy chat for record keeping.</li>
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default AIChat;