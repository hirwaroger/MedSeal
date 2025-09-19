import React from 'react';
import FAIcon from '../../components/FAIcon';

/**
 * A fallback view to display when content is missing or an error occurs
 */
function FallbackView({ 
  icon = "exclamation-circle", 
  title = "Content Unavailable", 
  message = "The requested content could not be displayed.",
  actionText = "Go Back",
  onAction = () => window.history.back(),
  actionType = "primary" 
}) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-6xl mb-4 text-gray-300">
        <FAIcon name={icon} className="inline-block" />
      </div>
      <h3 className="text-xl font-semibold text-gray-500 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {message}
      </p>
      {actionText && (
        <button
          onClick={onAction}
          className={`px-6 py-3 rounded-lg transition-colors ${
            actionType === 'primary' 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default FallbackView;
