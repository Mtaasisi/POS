import React from 'react';

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  className?: string;
}

const GlassTextarea: React.FC<GlassTextareaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-3 py-2 border rounded-lg
          bg-white/80 backdrop-blur-sm
          border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
          transition-all duration-200
          placeholder-gray-400
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default GlassTextarea;
