function PrescriptionHistory({ history, onLoadFromHistory, formatDateShort }) {
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📚</span>
          <h2 className="text-xl font-semibold text-gray-900">Recent Prescriptions</h2>
        </div>
      </div>
      <div>
        {history.map((entry, index) => (
          <div 
            key={entry.id}
            className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onLoadFromHistory(entry)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600">💊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Prescription #{entry.id}</h3>
                  <p className="text-sm text-gray-600">{formatDateShort(entry.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {entry.medicines_count} medicine{entry.medicines_count !== 1 ? 's' : ''}
                </span>
                {entry.doctor_notes && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                    <span>📝</span> Has notes
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PrescriptionHistory;
