import Button from './Button';

function EmptyState({ 
  icon = '📄', 
  title = 'No data found', 
  description = 'There is no data to display at the moment.',
  actionText = null,
  onAction = null
}) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-6">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-500 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
