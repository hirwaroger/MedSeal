import Button from './Button';

function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction, 
  className = '' 
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-6xl mb-6">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-500 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} icon="➕">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
