import React from 'react';

export const Select = ({ children, ...props }: any) => <div className="relative" {...props}>{children}</div>;
export const SelectTrigger = ({ children, className = '', ...props }: any) => (
  <button
    type="button"
    className={`flex items-center justify-between w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
    {...props}
  >
    {children}
  </button>
);
export const SelectValue = ({ placeholder, ...props }: any) => <span {...props}>{placeholder}</span>;
export const SelectContent = ({ children, ...props }: any) => (
  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg" {...props}>
    {children}
  </div>
);
export const SelectItem = ({ children, ...props }: any) => (
  <div className="px-3 py-2 cursor-pointer hover:bg-gray-100" {...props}>
    {children}
  </div>
);
