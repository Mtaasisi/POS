import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface NumberInputWithButtonsProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  error?: boolean;
  required?: boolean;
}

const NumberInputWithButtons: React.FC<NumberInputWithButtonsProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder,
  className = '',
  disabled = false,
  label,
  error = false,
  required = false
}) => {
  const handleIncrement = () => {
    if (disabled) return;
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = value - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newValue = parseInt(e.target.value) || 0;
    if (newValue >= min && (max === undefined || newValue <= max)) {
      onChange(newValue);
    }
  };

  const inputClassName = `w-full py-3 pl-12 pr-16 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-all duration-200 ${
    error 
      ? 'border-red-500 focus:border-red-600' 
      : value < min 
        ? 'border-yellow-300 focus:border-yellow-500' 
        : 'border-gray-300 focus:border-blue-500'
  } ${className}`;

  return (
    <div>
      {label && (
        <label className={`block mb-2 font-medium ${error ? 'text-red-600' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className={inputClassName}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        
        {/* Minus Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <Minus size={16} className="text-gray-600" />
        </button>
        
        {/* Plus Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value >= max)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <Plus size={16} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default NumberInputWithButtons; 