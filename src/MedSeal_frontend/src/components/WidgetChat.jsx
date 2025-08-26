import React, { useState, useRef, useEffect } from 'react';
import { MedSeal_backend } from 'declarations/MedSeal_backend';

// Simple markdown parser for AI responses
const parseMarkdown = (text) => {
  if (!text) return text;
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gim, '<h6 style="color: #2563eb; margin-top: 8px; margin-bottom: 4px;">$1</h6>')
    .replace(/^## (.*$)/gim, '<h6 style="color: #2563eb; margin-top: 8px; margin-bottom: 4px;">$1</h6>')
    .replace(/^# (.*$)/gim, '<h5 style="color: #2563eb; margin-top: 8px; margin-bottom: 4px;">$1</h5>')
    .replace(/^\- (.*$)/gim, '<li style="margin-bottom: 4px;">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li style="margin-bottom: 4px;">$2</li>')
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 2px 4px; border-radius: 4px;">$1</code>');
};

function WidgetChat({ userType, contextData, onClose, onExpand, showAlert }) {
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

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

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

      if (contextData?.prescription) {
        const context = {
          user_type: userType,
          prescription_data: contextData.prescription
        };
        console.log('Calling chat_prescription with context:', context);
        result = await MedSeal_backend.chat_prescription(chatMessages, context);
      } else if (contextData?.medicines) {
        const context = {
          user_type: userType,
          medicine_data: contextData.medicines
        };
        console.log('Calling chat_medicine with context:', context);
        result = await MedSeal_backend.chat_medicine(chatMessages, context);
      } else {
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
      } else {
        console.error('Unexpected response:', result);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I received an unexpected response. Please try again.'
        }]);
      }
    } catch (error) {
      console.error('Chat error details:', error);
      
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
    <div className="fixed bottom-20 right-4 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-sky-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-sm">Health Partner</h4>
            <p className="text-xs text-white/80">AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onExpand}
            className="text-white/80 hover:text-white transition-colors"
            title="Expand to full chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            title="Close chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatBoxRef}
        className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs p-3 rounded-lg text-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-200'
              }`}
            >
              {message.role === 'assistant' ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(message.content)
                  }}
                />
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm border border-gray-200 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Questions */}
      <div className="p-3 bg-white border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
        <div className="flex flex-wrap gap-1">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              disabled={isLoading}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default WidgetChat;