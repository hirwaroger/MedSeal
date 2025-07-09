import React, { useState, useRef, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

// Simple markdown parser for AI responses
const parseMarkdown = (text) => {
  if (!text) return text;
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gim, '<h6 class="text-primary mt-2 mb-1">$1</h6>')
    .replace(/^## (.*$)/gim, '<h6 class="text-primary mt-2 mb-1">$1</h6>')
    .replace(/^# (.*$)/gim, '<h5 class="text-primary mt-2 mb-1">$1</h5>')
    .replace(/^\- (.*$)/gim, '<li class="mb-1">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="mb-1">$2</li>')
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code class="bg-light px-1 rounded">$1</code>');
};

const WidgetChat = ({ userType, contextData, onClose, onExpand, showAlert }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: userType === 'doctor' 
        ? "Hello! I'm your **MedSeal Health Partner**. How can I help you with medical questions today?"
        : "Hi! I'm your **MedSeal Health Partner**. I can help you understand your medications. What would you like to know?"
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
      console.log('Context data:', contextData);

      const chatMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      chatMessages.push(userMessage);

      let result;

      // Widget chat typically uses general mode, but can use prescription if context is available
      if (contextData?.prescription) {
        // Prescription mode for patients
        const context = {
          user_type: userType,
          prescription_data: contextData.prescription
        };
        console.log('Calling chat_prescription with context:', context);
        result = await MedSeal_backend.chat_prescription(chatMessages, context);
      } else if (contextData?.medicines) {
        // Medicine mode for doctors
        const context = {
          user_type: userType,
          medicine_data: contextData.medicines
        };
        console.log('Calling chat_medicine with context:', context);
        result = await MedSeal_backend.chat_medicine(chatMessages, context);
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
        showAlert('error', 'AI Assistant Error: ' + result.Err);
      } else if (typeof result === 'string') {
        // Handle direct string response
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
      console.error('Chat error details:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      
      let errorMessage = 'I\'m sorry, I\'m having trouble connecting right now. ';
      
      if (error.message && error.message.includes('Invalid record')) {
        errorMessage = 'Data format error. Please try again.';
      } else if (error.message && error.message.includes('not a function')) {
        errorMessage = 'Backend service issue. The AI assistant is temporarily unavailable.';
      } else if (error.message) {
        errorMessage += 'Error: ' + error.message;
      } else {
        errorMessage += 'Please try again in a moment.';
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
      
      showAlert('error', 'Connection Error: ' + errorMessage);
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

  const quickQuestions = userType === 'doctor' 
    ? [
        "Drug interactions?",
        "Dosage help?",
        "Side effects?",
        "Alternatives?"
      ]
    : [
        "How to take meds?",
        "Side effects?",
        "With food?",
        "Missed dose?"
      ];

  return (
    <div className="health-widget-chat">
      <div className="health-widget-header">
        <div className="d-flex align-items-center">
          <div className="widget-avatar">
            <i className="fas fa-heart"></i>
          </div>
          <div className="ms-2">
            <h6 className="mb-0">Health Partner</h6>
            <small>AI Chat Active</small>
          </div>
        </div>
        <div className="widget-actions">
          <button 
            className="btn btn-sm btn-outline-light me-1"
            onClick={onExpand}
            title="Expand to full chat"
          >
            <i className="fas fa-expand"></i>
          </button>
          <button 
            className="btn btn-sm btn-outline-light"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div className="widget-chat-body" ref={chatBoxRef}>
        {messages.map((message, index) => (
          <div key={index} className={`widget-message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}>
            <div className="message-avatar">
              <i className={`fas ${
                message.role === 'user' 
                  ? 'fa-user' 
                  : 'fa-heart'
              }`}></i>
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-sender">
                  {message.role === 'user' ? 'You' : 'Health Partner'}
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
          <div className="widget-message ai-message">
            <div className="message-avatar">
              <i className="fas fa-heart"></i>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="widget-quick-actions">
        <div className="quick-questions-widget">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleQuickQuestion(question)}
              disabled={isLoading}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="widget-chat-footer">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              className="form-control form-control-sm"
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WidgetChat;