import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

interface PriceInputProps {
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  error?: string;
}

const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  placeholder = "0",
  className = "",
  disabled = false,
  min = 0,
  max,
  step = 0.01,
  label,
  error
}) => {
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);

  // Format number with commas for thousands separators
  const formatNumberWithCommas = (num: number | string): string => {
    if (!num && num !== 0) return '';
    const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  // Parse number from formatted string
  const parseNumberFromString = (str: string): number => {
    if (!str) return 0;
    const cleanValue = str.replace(/,/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Update display value when prop value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value === 0 || value === '' ? '' : formatNumberWithCommas(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow typing numbers, commas, and decimals
    if (inputValue === "" || inputValue === "0") {
      setDisplayValue("");
      onChange(0);
      return;
    }

    // Remove commas for processing
    const cleanValue = inputValue.replace(/,/g, '');
    
    // Allow valid number patterns including partial decimals
    if (/^\d*\.?\d*$/.test(cleanValue)) {
      setDisplayValue(inputValue);
      
      const numValue = parseFloat(cleanValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Remove formatting on focus for easier editing
    if (value && value !== 0) {
      setDisplayValue(value.toString());
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Apply formatting on blur
    if (value && value !== 0) {
      setDisplayValue(formatNumberWithCommas(value));
    } else {
      setDisplayValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Auto-format while typing (add commas)
    if (e.key === ',' || (e.key >= '0' && e.key <= '9')) {
      setTimeout(() => {
        const input = e.target as HTMLInputElement;
        const cursorPosition = input.selectionStart;
        const currentValue = input.value.replace(/,/g, '');
        
        if (currentValue && !isNaN(parseFloat(currentValue))) {
          const formatted = formatNumberWithCommas(parseFloat(currentValue));
          setDisplayValue(formatted);
          
          // Maintain cursor position after formatting
          setTimeout(() => {
            const newCursorPosition = formatted.length - (currentValue.length - (cursorPosition || 0));
            input.setSelectionRange(newCursorPosition, newCursorPosition);
          }, 0);
        }
      }, 0);
    }
  };

  return (
    <div>
      {label && (
        <label className={`block mb-2 font-medium ${error ? 'text-red-600' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full py-3 pl-12 pr-3 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 focus:outline-none focus:border-blue-500 transition-colors ${
            error ? 'border-red-500' : ''
          } ${className}`}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
        />
        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default PriceInput;
