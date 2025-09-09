import Button from './Button';

function EmptyState({ 
  icon = 'fa-file-alt', 
  title = 'No data found', 
  description = 'There is no data to display at the moment.',
  actionText = null,
  onAction = null
}) {
  const iconClass = typeof icon === 'string' ? icon : (icon && icon.iconName ? `fa-${icon.iconName}` : 'fa-file-alt');

  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-6">
        <i className={`fa-solid ${iconClass}`} aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold text-gray-500 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionText}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
