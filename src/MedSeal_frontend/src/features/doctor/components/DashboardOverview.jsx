function DashboardOverview({ user, medicines, prescriptions, onTabChange, onOpenAI }) {
  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, Dr. {user.name}
          </h1>
          <p className="text-gray-600 mb-6">
            Here's what's happening with your practice today
          </p>
          <div className="flex gap-4 flex-wrap">
            <button 
              onClick={() => onOpenAI(null, 'general')}
              className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span className="mr-2">🤖</span>
              AI Assistant
            </button>
            <button 
              onClick={() => onOpenAI({
                type: 'medicine_recommendations',
                context: 'dashboard_overview'
              }, 'recommendation')}
              className="inline-flex items-center px-4 py-2 border border-purple-300 text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition-colors"
            >
              <span className="mr-2">🧠</span>
              Medicine Recommendations
            </button>
            <button 
              onClick={() => onTabChange('prescriptions')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">➕</span>
              New Prescription
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">{medicines.length}</div>
                <div className="text-blue-100 text-sm">Total Medicines</div>
              </div>
              <div className="text-4xl opacity-80">💊</div>
            </div>
          </div>
          
          <div className="bg-green-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">{prescriptions.length}</div>
                <div className="text-green-100 text-sm">Prescriptions Created</div>
              </div>
              <div className="text-4xl opacity-80">📋</div>
            </div>
          </div>
          
          <div className="bg-blue-500 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">
                  {prescriptions.filter(p => p.accessed_at && p.accessed_at.length > 0).length}
                </div>
                <div className="text-blue-100 text-sm">Accessed</div>
              </div>
              <div className="text-4xl opacity-80">✅</div>
            </div>
          </div>
          
          <div className="bg-yellow-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">
                  {prescriptions.filter(p => !p.accessed_at || p.accessed_at.length === 0).length}
                </div>
                <div className="text-yellow-100 text-sm">Pending</div>
              </div>
              <div className="text-4xl opacity-80">⏰</div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📈</span>
                  <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <button 
                  onClick={() => onTabChange('history')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
              <div>
                {prescriptions.slice(0, 5).map((prescription, index) => (
                  <div key={index} className={`p-4 ${index < 4 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600">📋</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          Prescription #{prescription.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Created for {prescription.patient_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(Number(prescription.created_at) / 1000000).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        prescription.accessed_at && prescription.accessed_at.length > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {prescription.accessed_at && prescription.accessed_at.length > 0 ? 'Accessed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
                {prescriptions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                      No prescriptions created yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Create your first prescription to see activity here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Actions and Tips */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={() => onTabChange('add-medicine')}
                  className="w-full flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-2xl mr-3">➕</span>
                  <div>
                    <div className="font-semibold text-gray-900">Add Medicine</div>
                    <div className="text-sm text-gray-600">Build your repository</div>
                  </div>
                </button>
                <button 
                  onClick={() => onTabChange('prescriptions')}
                  className="w-full flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-2xl mr-3">📋</span>
                  <div>
                    <div className="font-semibold text-gray-900">New Prescription</div>
                    <div className="text-sm text-gray-600">Create for patient</div>
                  </div>
                </button>
                <button 
                  onClick={() => onTabChange('medicines')}
                  className="w-full flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-2xl mr-3">💊</span>
                  <div>
                    <div className="font-semibold text-gray-900">View Medicines</div>
                    <div className="text-sm text-gray-600">Manage repository</div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <h2 className="text-xl font-semibold text-gray-900">Tips</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-red-600 text-xl">📄</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">OCR Technology</h3>
                    <p className="text-sm text-gray-600">Upload PDF guides for automatic text extraction</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">🤖</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                    <p className="text-sm text-gray-600">Get help with prescriptions and medical questions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
