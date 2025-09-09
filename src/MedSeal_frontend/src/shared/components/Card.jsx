import React from 'react';

function Card({ 
  children, 
  title, 
  icon, 
  className = '' 
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {(title || icon) && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
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
