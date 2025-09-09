function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  icon = 'fa-search',
  className = "" 
}) {
  const iconClass = typeof icon === 'string' ? icon : (icon && icon.iconName ? `fa-${icon.iconName}` : 'fa-search');

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-400">
          <i className={`fa-solid ${iconClass}`} aria-hidden="true" />
        </span>
      </div>
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {value && (
        <button
          onClick={() => onChange({ target: { value: '' } })}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <i className="fa-solid fa-times" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
