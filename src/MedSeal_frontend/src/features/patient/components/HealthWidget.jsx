import FAIcon from '../../../components/FAIcon';

function HealthWidget({ 
  onClose, 
  onGeneralChat, 
  onFullChat, 
  onPrescriptionMode, 
  currentPrescription,
  showAlert 
}) {
  return (
    <div className="fixed bottom-24 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <FAIcon name="heart" className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Health Partner</h3>
            <p className="text-xs text-blue-100">AI Assistant</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded p-1"
        >
          <FAIcon name="times" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-gray-700 mb-4">
          Your AI health assistant is ready to help with medication questions.
        </p>
        <div className="space-y-2">
          <button 
            onClick={onGeneralChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FAIcon name="comment" />
            General Chat
          </button>
          <button 
            onClick={onFullChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FAIcon name="search" />
            Full Chat
          </button>
          <button 
            onClick={() => {
              if (currentPrescription) {
                onPrescriptionMode();
              } else {
                showAlert('warning', 'Please access a prescription first to use prescription mode.');
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FAIcon name="pills" />
            Prescription Mode
          </button>
        </div>
      </div>
    </div>
  );
}

export default HealthWidget;
