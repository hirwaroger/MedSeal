function Card({ 
  children, 
  title, 
  icon, 
  className = '', 
  headerAction = null,
  padding = 'p-6' 
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {title && (
        <div className={`${padding} border-b border-gray-200 flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          {headerAction}
        </div>
      )}
      <div className={title ? padding : padding}>
        {children}
      </div>
    </div>
  );
}

export default Card;
