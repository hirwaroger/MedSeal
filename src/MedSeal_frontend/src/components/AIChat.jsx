import React, { useState, useRef, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

// Simple markdown parser for AI responses
const parseMarkdown = (text) => {
  if (!text) return text;
  
  return text
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.*$)/gim, '<h5 class="text-primary mt-3 mb-2">$1</h5>')
    .replace(/^## (.*$)/gim, '<h4 class="text-primary mt-3 mb-2">$1</h4>')
    .replace(/^# (.*$)/gim, '<h3 class="text-primary mt-3 mb-2">$1</h3>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li class="mb-1">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="mb-1">$2</li>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Code blocks (inline)
    .replace(/`([^`]+)`/g, '<code class="bg-light px-2 py-1 rounded">$1</code>')
    // Wrap consecutive list items
    .replace(/(<li.*?<\/li>)/g, (match, p1) => {
      return p1;
    });
};

const AIChat = ({ userType, contextData, onClose, title, initialMode = 'general' }) => {
  const [chatMode, setChatMode] = useState(initialMode); // 'general' or 'prescription'
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: userType === 'doctor' 
        ? "Hello! I'm your **MedSeal Health Partner**, your AI medical assistant. I can help you with:\n\n- Medication information and interactions\n- Dosage guidelines and calculations\n- Clinical insights and best practices\n- Drug safety information\n\nHow can I assist you today?"
        : "Hi! I'm your **MedSeal Health Partner**, your personal health assistant. I can help you with:\n\n- Understanding your medications\n- Explaining side effects and precautions\n- Medication timing and food interactions  \n- General health questions\n\nWhat would you like to know?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

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
          // Patient prescription mode
          const context = {
            user_type: userType,
            prescription_data: contextData.prescription
          };
          console.log('Calling chat_prescription with context:', context);
          result = await MedSeal_backend.chat_prescription(chatMessages, context);
        } else if (userType === 'doctor' && contextData?.medicines) {
          // Doctor medicine mode
          const context = {
            user_type: userType,
            medicine_data: contextData.medicines
          };
          console.log('Calling chat_medicine with context:', context);
          result = await MedSeal_backend.chat_medicine(chatMessages, context);
        } else {
          // Fallback to general if no proper context
          const context = {
            user_type: userType
          };
          console.log('Calling chat_general (fallback) with context:', context);
          result = await MedSeal_backend.chat_general(chatMessages, context);
        }
      } else {
        // General mode
        const context = {
          user_type: userType
        };
        console.log('Calling chat_general with context:', context);
        result = await MedSeal_backend.chat_general(chatMessages, context);
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
        errorMessage = 'Backend service issue. The AI assistant is temporarily unavailable. Please try again later.';
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

  // Update the return statement with improved design and more visible close button
  return (
    <div className="ai-chat-overlay" onClick={(e) => {
      // Close if clicking outside the chat container
      if (e.target.className === 'ai-chat-overlay') {
        onClose();
      }
    }}>
      <div className="ai-chat-container">
        <div className="ai-chat-header">
          <div className="d-flex align-items-center">
            <div className="ai-avatar">
              <i className={`fas ${userType === 'doctor' ? 'fa-stethoscope' : 'fa-heart'}`}></i>
            </div>
            <div className="ms-3">
              <h5 className="mb-0">{title || 'MedSeal Health Partner'}</h5>
              <small className="text-white-50">
                {userType === 'doctor' ? 'Medical Assistant' : 'Health Guide'} - {chatMode === 'prescription' ? 'Prescription Mode' : 'General Mode'}
              </small>
            </div>
          </div>
          <button 
            className="btn btn-light btn-sm rounded-circle close-button" 
            onClick={onClose}
            aria-label="Close chat"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Mode Selection */}
        <div className="ai-chat-mode-selector">
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn btn-sm ${chatMode === 'general' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setChatMode('general')}
            >
              <i className="fas fa-globe me-1"></i>
              General Assistant
            </button>
            <button
              type="button"
              className={`btn btn-sm ${chatMode === 'prescription' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setChatMode('prescription')}
              disabled={!contextData || (!contextData.prescription && !contextData.medicines)}
            >
              <i className="fas fa-prescription me-1"></i>
              Prescription Assistant
            </button>
          </div>
          {chatMode === 'prescription' && (!contextData || (!contextData.prescription && !contextData.medicines)) && (
            <small className="text-muted d-block text-center mt-1">
              {userType === 'doctor' ? 'Add medicines to enable prescription mode' : 'Access a prescription to enable prescription mode'}
            </small>
          )}
        </div>

        <div className="ai-chat-body" ref={chatBoxRef}>
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}>
              <div className="message-avatar">
                <i className={`fas ${
                  message.role === 'user' 
                    ? 'fa-user' 
                    : userType === 'doctor' 
                      ? 'fa-stethoscope' 
                      : 'fa-heart'
                }`}></i>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">
                    {message.role === 'user' 
                      ? 'You' 
                      : 'MedSeal Health Partner'
                    }
                  </span>
                  <span className="message-time">{formatTime(new Date())}</span>
                </div>
                <div 
                  className="message-text"
                  dangerouslySetInnerHTML={{ 
                    __html: message.role === 'assistant' 
                      ? parseMarkdown(message.content) 
                      : message.content 
                  }}
                />
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai-message">
              <div className="message-avatar">
                <i className={`fas ${userType === 'doctor' ? 'fa-stethoscope' : 'fa-heart'}`}></i>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">MedSeal Health Partner</span>
                  <span className="message-time">{formatTime(new Date())}</span>
                </div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ai-chat-quick-actions">
          <div className="quick-questions">
            <small className="text-muted mb-2 d-block">
              Quick questions ({chatMode === 'prescription' ? 'Prescription Mode' : 'General Mode'}):
            </small>
            {currentQuickQuestions.map((question, index) => (
              <button
                key={index}
                className="btn btn-sm btn-outline-primary me-2 mb-2"
                onClick={() => handleQuickQuestion(question)}
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className="ai-chat-footer">
          <form onSubmit={handleSubmit} className="d-flex gap-2">
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Ask MedSeal Health Partner anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChat;