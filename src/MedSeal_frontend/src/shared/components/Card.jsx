function Card({ 
  children, 
  title, 
  icon, 
  className = '', 
  headerActions = null 
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {title && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && <span className="text-2xl">{icon}</span>}
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            </div>
            {headerActions}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default Card;
