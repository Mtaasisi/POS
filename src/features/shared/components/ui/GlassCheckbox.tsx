import React from 'react';

interface GlassCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

const GlassCheckbox: React.FC<GlassCheckboxProps> = ({
  label,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        className={`
          w-4 h-4 text-blue-600 bg-white/80 backdrop-blur-sm
          border-gray-300 rounded focus:ring-blue-500
          focus:ring-2 focus:ring-offset-0
        `}
        {...props}
      />
      {label && (
        <label className="ml-2 text-sm text-gray-700">
          {label}
        </label>
      )}
    </div>
  );
};

export default GlassCheckbox;
