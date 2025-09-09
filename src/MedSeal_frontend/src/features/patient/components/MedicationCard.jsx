import { useState } from 'react';
import FAIcon from '../../../components/FAIcon';

function MedicationCard({ 
  medicine, 
  index, 
  onViewGuide, 
  onAskAI, 
  expandedAccordions, 
  onToggleAccordion 
}) {
  const med = medicine;
  
  console.log('LOG: MedicationCard received medicine data:', med);

  // Handle case where medicine data is missing
  if (!med || !med.medicine) {
    console.warn('LOG: MedicationCard missing medicine data:', med);
    return (
      <div className="border border-gray-200 rounded-xl border-l-4 border-l-red-500">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FAIcon name="triangle-exclamation" className="text-red-600" />
            <h3 className="text-lg font-semibold text-red-700">
              Medicine Data Unavailable
            </h3>
          </div>
          <p className="text-red-600">
            Medicine ID: {med?.medicine_id || 'Unknown'}
          </p>
          {med?.custom_instructions && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                Custom Instructions: {med.custom_instructions}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  console.log('LOG: MedicationCard medicine details:', {
    name: med.medicine?.name,
    dosage: med.medicine?.dosage,
    customDosage: med.custom_dosage,
    frequency: med.medicine?.frequency,
    duration: med.medicine?.duration
  });

  return (
    <div className="border border-gray-200 rounded-xl border-l-4 border-l-blue-500">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <FAIcon name="pills" className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {med.medicine?.name || 'Unknown Medicine'}
          </h3>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {/* Medicine Details */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Dosage:</span>
            <span className="text-sm font-medium text-gray-900">
              {med.custom_dosage || med.medicine?.dosage || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Frequency:</span>
            <span className="text-sm font-medium text-gray-900">
              {med.medicine?.frequency || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Duration:</span>
            <span className="text-sm font-medium text-gray-900">
              {med.medicine?.duration || 'N/A'}
            </span>
          </div>
        </div>

        {/* Custom Instructions */}
        {med.custom_instructions && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FAIcon name="triangle-exclamation" className="text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">Special Instructions</h4>
            </div>
            <p className="text-sm text-yellow-700">
              {med.custom_instructions}
            </p>
          </div>
        )}

        {/* Side Effects */}
        {med.medicine?.side_effects && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Possible Side Effects
            </label>
            <p className="text-sm text-gray-600">
              {med.medicine.side_effects}
            </p>
          </div>
        )}

        {/* Medicine Guide */}
        {med.medicine?.guide_text && med.medicine.guide_text !== 'No guide available' && (
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => onToggleAccordion(`${index}_guide`)}
              className="w-full p-3 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">Medicine Guide</span>
              <span className="text-gray-500">
                {expandedAccordions[`${index}_guide`] ? '−' : '+'}
              </span>
            </button>
            {expandedAccordions[`${index}_guide`] && (
              <div className="p-3 border-t border-gray-200">
                <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-auto bg-gray-50 p-3 rounded font-mono">
                  {med.medicine.guide_text.length > 300 
                    ? med.medicine.guide_text.substring(0, 300) + '...'
                    : med.medicine.guide_text
                  }
                </div>
                {med.medicine.guide_text.length > 300 && (
                  <button 
                    onClick={() => onViewGuide(med.medicine)}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <span className="inline-flex items-center"><FAIcon name="file-lines" className="mr-2" />Read Full Guide</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button 
            onClick={() => onAskAI({
              prescription: `Specific question about ${med.medicine?.name}: ${med.medicine?.side_effects || 'No side effects listed'}. Guide: ${med.medicine?.guide_text || 'No guide available'}`
            })}
            className="inline-flex items-center px-3 py-2 border border-blue-300 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-50 transition-colors"
          >
            <FAIcon name="robot" className="mr-1" />
            Ask AI About This
          </button>
          {med.medicine?.guide_text && med.medicine.guide_text !== 'No guide available' && (
            <button 
              onClick={() => onViewGuide(med.medicine)}
              className="inline-flex items-center px-3 py-2 border border-green-300 text-green-700 text-sm font-medium rounded-md hover:bg-green-50 transition-colors"
            >
              <FAIcon name="file-lines" className="mr-1" />
              View Guide
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MedicationCard;
