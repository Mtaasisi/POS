import React from 'react';

interface PriceInputProps {
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  placeholder = "0.00",
  className = "",
  disabled = false,
  min = 0,
  max,
  step = 0.01
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty string or valid numbers
    if (inputValue === "" || inputValue === "0") {
      onChange(0);
      return;
    }
    
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  const formatValue = (val: number | string): string => {
    if (val === 0 || val === "") return "";
    return typeof val === 'number' ? val.toString() : val;
  };

  return (
    <input
      type="number"
      value={formatValue(value)}
      onChange={handleChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
    />
  );
};

export default PriceInput;
