import React from 'react';

// Simple FontAwesome wrapper. Assumes FontAwesome CSS is loaded globally.
export default function FAIcon({ name, className = '', title, ...props }) {
  return (
    <i
      className={`fa-solid fa-${name} ${className}`.trim()}
      aria-hidden={!title}
      title={title}
      {...props}
    />
  );
}
