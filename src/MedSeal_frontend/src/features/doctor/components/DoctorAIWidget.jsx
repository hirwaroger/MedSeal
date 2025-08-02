function DoctorAIWidget({ 
  onClose, 
  onGeneralChat, 
  onMedicineChat, 
  onPrescriptionChat, 
  onRecommendationChat,
  showAlert 
}) {
  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span>🩺</span>
          </div>
          <div>
            <h3 className="font-semibold">Medical AI Assistant</h3>
            <p className="text-xs text-blue-100">Doctor's AI Partner</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded p-1"
        >
          <span>✕</span>
        </button>
      </div>
      <div className="p-4">
        <p className="text-gray-700 mb-4 text-sm">
          Your AI medical assistant for prescriptions, medicine guidance, and clinical support.
        </p>
        <div className="space-y-2">
          <button 
            onClick={onGeneralChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <span>💬</span>
            General Medical Chat
          </button>
          <button 
            onClick={onMedicineChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <span>💊</span>
            Medicine Repository Chat
          </button>
          <button 
            onClick={onPrescriptionChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <span>📋</span>
            Prescription Analysis
          </button>
          <button 
            onClick={onRecommendationChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <span>🧠</span>
            Medicine Recommendations
          </button>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Powered by Llama 3.1 • Clinical Decision Support
          </p>
        </div>
      </div>
    </div>
  );
}

export default DoctorAIWidget;
